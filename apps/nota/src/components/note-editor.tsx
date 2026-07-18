import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  memo,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import {
  TipTapEditor,
  type AttachmentStorageOps,
  noteEditorSettingsToJson,
  parseNoteEditorSettings,
  type NoteEditorSettings,
} from '@nota/editor';
import { useStickyDocTitle } from '../context/sticky-doc-title';
import { persistedDisplayTitle } from '../lib/note-title';
import { getBrowserClient } from '../lib/supabase/browser';
import { useRootLoaderData } from '../context/session-context';
import {
  useNotesDataMeta,
  useNotesDataActions,
} from '../context/notes-data-context';
import { editorDraftContext } from '../lib/note-editor-draft-context';
import { noteAfterPatchMutation } from '../lib/note-patch-result';
import { vaultMutator } from '../lib/notes-vault-runtime';
import type { Json, Note, NoteAttachment } from '~/types/database.types';
import { NoteLayoutMenu } from './note-layout-menu';
import {
  NoteImageLightbox,
  type NoteImageLightboxImage,
} from './note-image-lightbox';
import { cn } from '@/lib/utils';
import { NOTA_TRACKING_DISPLAY_CLASS } from '@/lib/notes-chrome-type';
import type { Editor } from '@tiptap/core';
import {
  classifyNoteAttachmentFile,
  isImageFile,
  uploadNoteAttachmentFile,
  getOrFetchNoteAttachmentSignedUrl,
  downloadBlobFromSignedUrl,
  ATTACHMENT_SIGNED_URL_TTL_SEC,
} from '../lib/pdf-attachment-client';
import { getValidNoteAttachmentSignedUrlCacheEntry } from '../lib/note-attachment-signed-url-cache';
import {
  NOTE_PDFS_BUCKET,
  deleteNoteAttachment,
  updateNoteAttachmentFilename,
} from '../models/note-attachments';
import { fetchOgPreviewForEditor } from '../lib/og-preview-client';
import { useNotaTranslator } from '../lib/use-nota-translator';
import { parseNoteLinkPath, hrefForNote } from '../lib/internal-note-link';
import {
  absoluteUrlForNote,
  navigateFromLegacyPath,
} from '../lib/app-navigation';
import { useNotaPreferencesStore } from '../stores/nota-preferences';
import { createTypewriterScrollUserGuard } from '@/lib/nota-typewriter-scroll-guard';
import { NOTA_SAVE_PULSE_CLASS } from '@/lib/nota-interaction';
import { createWritingActivitySessionRecorder } from '@/lib/writing-activity-tracking';

function buildStorageOps(
  noteId: string,
  userId: string,
  translateUi: (key: string) => string,
): AttachmentStorageOps {
  const client = getBrowserClient();
  return {
    signedUrlTtlSec: ATTACHMENT_SIGNED_URL_TTL_SEC,
    getOrFetchSignedUrl: (attachmentId, storagePath) =>
      getOrFetchNoteAttachmentSignedUrl(attachmentId, storagePath),
    getValidCachedSignedUrl: (attachmentId, storagePath) =>
      getValidNoteAttachmentSignedUrlCacheEntry(attachmentId, storagePath),
    createRawSignedUrl: async (storagePath, ttlSec) => {
      const { data, error } = await client.storage
        .from(NOTE_PDFS_BUCKET)
        .createSignedUrl(storagePath, ttlSec);
      if (error || !data.signedUrl) {
        return {
          ok: false,
          error: error?.message ?? 'Could not create signed URL',
        };
      }
      return { ok: true, signedUrl: data.signedUrl };
    },
    downloadAttachment: (url, filename) =>
      downloadBlobFromSignedUrl(url, filename),
    removeStorageFile: async (storagePath) => {
      const { error } = await client.storage
        .from(NOTE_PDFS_BUCKET)
        .remove([storagePath]);
      if (error) throw new Error(error.message);
    },
    deleteAttachmentRecord: async (attachmentId) => {
      await deleteNoteAttachment(client, attachmentId);
    },
    renameAttachmentRecord: async (attachmentId, newFilename) => {
      await updateNoteAttachmentFilename(client, attachmentId, newFilename);
    },
    fetchOgPreview: fetchOgPreviewForEditor,
    translateUi,
  };
}

interface NoteEditorProps {
  note: Note;
  /** Full vault list for `@` mention candidates (parent avoids TipTap subscribing to vault context). */
  noteMentionCandidates: Note[];
  attachments: NoteAttachment[];
  titleFontClassName: string;
  bodyFontClassName: string;
  onNoteUpdated?: (note: Note) => void;
  bannerSignedUrl?: string | null;
}

const SAVE_DEBOUNCE_MS = 800;

function NoteEditorImpl({
  note,
  noteMentionCandidates,
  attachments,
  titleFontClassName,
  bodyFontClassName,
  onNoteUpdated,
  bannerSignedUrl,
}: NoteEditorProps) {
  const { user } = useRootLoaderData();
  const { notaProEntitled } = useNotesDataMeta();
  const { refreshNotesList } = useNotesDataActions();
  const emojiReplacerEnabled = useNotaPreferencesStore(
    (s) => s.emojiReplacerEnabled,
  );
  const cursorVisualStyle = useNotaPreferencesStore((s) => s.cursorVisualStyle);
  const { scrollRootRef, scrollRootEpoch, setSticky, resetSticky } =
    useStickyDocTitle();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>(
    'saved',
  );
  const [lightboxImage, setLightboxImage] =
    useState<NoteImageLightboxImage | null>(null);
  const [title, setTitle] = useState(() => note.title || '');

  const { t } = useNotaTranslator();
  const storageOps = useMemo(
    () => buildStorageOps(note.id, user?.id ?? '', t),

    [note.id, user?.id, t],
  );

  const titleRowRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyEditorRef = useRef<Editor | null>(null);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typewriterRafRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef(false);
  const lastSavedContent = useRef(note.content);
  const lastSavedTitle = useRef(persistedDisplayTitle(note.title || ''));
  const titleRef = useRef(note.title || '');
  const pendingContentRef = useRef<unknown>(null);
  const noteRef = useRef(note);
  const onNoteUpdatedRef = useRef(onNoteUpdated);
  const userIdRef = useRef(user?.id);
  const notaProEntitledRef = useRef(notaProEntitled);
  const typewriterScrollGuard = useMemo(
    () => createTypewriterScrollUserGuard(),
    [],
  );
  const editorDomBindGenerationRef = useRef(0);
  const writingActivityRecorderRef = useRef(
    createWritingActivitySessionRecorder(),
  );
  noteRef.current = note;
  onNoteUpdatedRef.current = onNoteUpdated;
  userIdRef.current = user?.id;
  notaProEntitledRef.current = notaProEntitled;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      prefersReducedMotionRef.current = mediaQuery.matches;
    };
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    resetSticky();
    const initialTitle = note.title || '';
    setTitle(initialTitle);
    titleRef.current = initialTitle;
    lastSavedTitle.current = persistedDisplayTitle(initialTitle);
    lastSavedContent.current = note.content;
    pendingContentRef.current = null;
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = null;
    }
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
    if (typewriterRafRef.current !== null) {
      cancelAnimationFrame(typewriterRafRef.current);
      typewriterRafRef.current = null;
    }
    typewriterScrollGuard.reset();
    writingActivityRecorderRef.current.reset();
    // Reset local editor state when switching notes only — not on every parent refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- note.content/title sync via refs and debounced save
  }, [note.id, resetSticky, typewriterScrollGuard]);

  const syncTitleTextareaHeight = useCallback(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${String(el.scrollHeight)}px`;
  }, []);

  useLayoutEffect(() => {
    syncTitleTextareaHeight();
  }, [title, note.id, syncTitleTextareaHeight]);

  useEffect(() => {
    setSticky({ label: persistedDisplayTitle(title) });
  }, [title, setSticky]);

  useLayoutEffect(() => {
    const root = scrollRootRef.current;
    const target = titleRowRef.current;
    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setSticky({ visible: !entry.isIntersecting });
      },
      { root, threshold: 0 },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [note.id, scrollRootEpoch, scrollRootRef, setSticky]);

  useLayoutEffect(() => {
    const root = scrollRootRef.current;
    if (!root) {
      return;
    }
    const onScroll = () => {
      typewriterScrollGuard.onScrollRootScroll();
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
    };
  }, [note.id, scrollRootEpoch, scrollRootRef, typewriterScrollGuard]);

  useLayoutEffect(() => {
    const gen = ++editorDomBindGenerationRef.current;
    let raf: number | null = null;
    let cleanupDom: (() => void) | null = null;

    const schedule = () => {
      raf = requestAnimationFrame(() => {
        raf = null;
        if (gen !== editorDomBindGenerationRef.current) {
          return;
        }
        const ed = bodyEditorRef.current;
        if (!ed || ed.isDestroyed) {
          if (gen === editorDomBindGenerationRef.current) {
            schedule();
          }
          return;
        }
        const dom = ed.view.dom;
        const onGesture = () => {
          typewriterScrollGuard.onEditorUserGesture();
        };
        dom.addEventListener('beforeinput', onGesture, { passive: true });
        dom.addEventListener('paste', onGesture);
        dom.addEventListener('pointerdown', onGesture);
        cleanupDom = () => {
          dom.removeEventListener('beforeinput', onGesture);
          dom.removeEventListener('paste', onGesture);
          dom.removeEventListener('pointerdown', onGesture);
          cleanupDom = null;
        };
      });
    };

    schedule();

    return () => {
      editorDomBindGenerationRef.current += 1;
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
      cleanupDom?.();
    };
  }, [note.id, typewriterScrollGuard]);

  useEffect(() => {
    return () => {
      resetSticky();
    };
  }, [resetSticky]);

  const scheduleTitleSave = useCallback(() => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
    }
    titleDebounceRef.current = setTimeout(() => {
      void (async () => {
        titleDebounceRef.current = null;
        const next = persistedDisplayTitle(titleRef.current);
        if (next === lastSavedTitle.current) {
          return;
        }
        if (!user?.id) {
          return;
        }
        setSaveStatus('saving');
        try {
          const result = await vaultMutator.patchNote(user.id, {
            noteId: note.id,
            fields: { title: next },
            draftContext: editorDraftContext(noteRef.current, {
              title: next,
              content: lastSavedContent.current as Json,
            }),
            allowRemote: notaProEntitledRef.current,
          });
          setSaveStatus('saved');
          lastSavedTitle.current = next;
          onNoteUpdated?.(
            noteAfterPatchMutation(
              result,
              noteRef.current,
              { title: next },
              pendingContentRef.current,
              lastSavedContent.current as Json,
            ),
          );
        } catch (error) {
          console.error('Failed to save title:', error);
          setSaveStatus('error');
        }
      })();
    }, SAVE_DEBOUNCE_MS);
  }, [note, onNoteUpdated, user?.id]);

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      setTitle(v);
      titleRef.current = v;
      setSaveStatus('saving');
      writingActivityRecorderRef.current.record();
      scheduleTitleSave();
    },
    [scheduleTitleSave],
  );

  const handleTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        (e.key === 'Enter' || e.key === 'NumpadEnter') &&
        !e.shiftKey &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        const ed = bodyEditorRef.current;
        if (ed && !ed.isDestroyed) {
          ed.chain().focus('start').run();
        }
      }
    },
    [],
  );

  const alignTypewriterScroll = useCallback(() => {
    const root = scrollRootRef.current;
    const editor = bodyEditorRef.current;
    if (!root || !editor || editor.isDestroyed || !editor.isFocused) {
      return;
    }
    if (typewriterScrollGuard.shouldSkipTypewriterAlign()) {
      return;
    }

    const { selection } = editor.state;
    if (!selection.empty) {
      return;
    }

    let caretTop = 0;
    try {
      caretTop = editor.view.coordsAtPos(selection.from).top;
    } catch {
      return;
    }

    const rootRectTop = root.getBoundingClientRect().top;
    const currentScrollTop = root.scrollTop;
    const caretYInScroll = caretTop - rootRectTop + currentScrollTop;
    const targetYInScroll = currentScrollTop + root.clientHeight * 0.4;
    const delta = caretYInScroll - targetYInScroll;
    const deadzonePx = Math.max(18, root.clientHeight * 0.02);

    if (delta <= deadzonePx) {
      return;
    }

    const maxScrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
    const nextScrollTop = Math.min(maxScrollTop, currentScrollTop + delta);

    if (Math.abs(nextScrollTop - currentScrollTop) < 1) {
      return;
    }

    typewriterScrollGuard.beforeProgrammaticScroll();
    if (prefersReducedMotionRef.current) {
      root.scrollTop = nextScrollTop;
      return;
    }

    root.scrollTo({ top: nextScrollTop, behavior: 'auto' });
  }, [scrollRootRef, typewriterScrollGuard]);

  const scheduleTypewriterScroll = useCallback(() => {
    if (typewriterRafRef.current !== null) {
      cancelAnimationFrame(typewriterRafRef.current);
    }
    typewriterRafRef.current = requestAnimationFrame(() => {
      typewriterRafRef.current = null;
      alignTypewriterScroll();
    });
  }, [alignTypewriterScroll]);

  const scheduleContentSave = useCallback(() => {
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
    }
    contentDebounceRef.current = setTimeout(() => {
      void (async () => {
        contentDebounceRef.current = null;
        const toSave = pendingContentRef.current;
        if (toSave === null || toSave === undefined) {
          return;
        }
        if (
          JSON.stringify(toSave) === JSON.stringify(lastSavedContent.current)
        ) {
          setSaveStatus('saved');
          return;
        }
        if (!user?.id) {
          return;
        }
        setSaveStatus('saving');
        try {
          const titleForRow = persistedDisplayTitle(titleRef.current);
          const result = await vaultMutator.patchNote(user.id, {
            noteId: note.id,
            fields: { content: toSave as Json },
            draftContext: editorDraftContext(noteRef.current, {
              title: titleForRow,
              content: toSave as Json,
            }),
            allowRemote: notaProEntitledRef.current,
          });
          const mergedBody = (pendingContentRef.current ?? toSave) as Json;
          lastSavedContent.current = mergedBody;
          setSaveStatus('saved');
          onNoteUpdated?.(
            noteAfterPatchMutation(
              result,
              noteRef.current,
              { title: titleForRow, content: mergedBody },
              pendingContentRef.current,
              toSave as Json,
            ),
          );
        } catch (error) {
          console.error('Failed to save note:', error);
          setSaveStatus('error');
        }
      })();
    }, SAVE_DEBOUNCE_MS);
  }, [note, onNoteUpdated, user?.id]);

  const handleUpdate = useCallback(
    (content: unknown) => {
      pendingContentRef.current = content;
      writingActivityRecorderRef.current.record();
      scheduleContentSave();
      scheduleTypewriterScroll();
    },
    [scheduleContentSave, scheduleTypewriterScroll],
  );

  const persistEditorSettings = useCallback(
    async (next: NoteEditorSettings) => {
      const userId = userIdRef.current;
      if (!userId) {
        return;
      }
      const n = noteRef.current;
      const json = noteEditorSettingsToJson(next);
      const titleForRow = persistedDisplayTitle(titleRef.current);
      const contentForRow = (pendingContentRef.current ??
        lastSavedContent.current) as Json;
      setSaveStatus('saving');
      try {
        const result = await vaultMutator.patchNote(userId, {
          noteId: n.id,
          fields: { editor_settings: json },
          draftContext: editorDraftContext(n, {
            title: titleForRow,
            content: contentForRow,
            editor_settings: json,
          }),
          allowRemote: notaProEntitledRef.current,
        });
        onNoteUpdatedRef.current?.(
          noteAfterPatchMutation(
            result,
            n,
            { editor_settings: json },
            pendingContentRef.current,
            lastSavedContent.current as Json,
          ),
        );
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save note layout:', error);
        setSaveStatus('error');
      }
    },
    [],
  );

  const persistBanner = useCallback(async (attachmentId: string | null) => {
    const userId = userIdRef.current;
    if (!userId) return;
    const n = noteRef.current;
    const titleForRow = persistedDisplayTitle(titleRef.current);
    const contentForRow = (pendingContentRef.current ??
      lastSavedContent.current) as Json;
    setSaveStatus('saving');
    try {
      const result = await vaultMutator.patchNote(userId, {
        noteId: n.id,
        fields: { banner_attachment_id: attachmentId },
        draftContext: editorDraftContext(n, {
          title: titleForRow,
          content: contentForRow,
          banner_attachment_id: attachmentId,
        }),
        allowRemote: notaProEntitledRef.current,
      });
      onNoteUpdatedRef.current?.(
        noteAfterPatchMutation(
          result,
          n,
          { banner_attachment_id: attachmentId },
          pendingContentRef.current,
          lastSavedContent.current as Json,
        ),
      );
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save banner:', error);
      setSaveStatus('error');
    }
  }, []);

  const handleBannerUpload = useCallback(
    async (file: File): Promise<string> => {
      const userId = userIdRef.current;
      if (!userId) throw new Error('Not authenticated');
      if (!isImageFile(file)) throw new Error('Please choose an image file.');
      const attachment = await uploadNoteAttachmentFile(
        noteRef.current.id,
        userId,
        file,
      );
      return attachment.id;
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current);
      }
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
      if (typewriterRafRef.current !== null) {
        cancelAnimationFrame(typewriterRafRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'nota-caret-surface space-y-6',
        cursorVisualStyle === 'block'
          ? 'nota-caret--block'
          : 'nota-caret--line',
      )}
    >
      <div ref={titleRowRef} className="flex items-start justify-between gap-4">
        <textarea
          ref={titleTextareaRef}
          name="note-title"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          autoComplete="off"
          aria-label="Note title"
          rows={1}
          className={cn(
            'min-h-0 min-w-0 flex-1 resize-none overflow-hidden break-words border-0 bg-transparent p-0 text-4xl font-extrabold leading-tight text-pretty text-foreground placeholder:text-muted-foreground/70 focus:outline-none md:text-5xl',
            NOTA_TRACKING_DISPLAY_CLASS,
            titleFontClassName,
          )}
        />
        <div
          className="flex shrink-0 items-start justify-end gap-2 pt-3 md:pt-4"
          aria-live="polite"
        >
          <NoteLayoutMenu
            settings={parseNoteEditorSettings(note.editor_settings)}
            onSettingsChange={(next) => {
              void persistEditorSettings(next);
            }}
            disabled={!user?.id}
            bannerAttachmentId={note.banner_attachment_id}
            bannerSignedUrl={bannerSignedUrl}
            onBannerChange={(attachmentId) => {
              void persistBanner(attachmentId);
            }}
            onBannerUpload={handleBannerUpload}
          />
          {saveStatus === 'saving' && (
            <span
              className={cn(
                NOTA_SAVE_PULSE_CLASS,
                'mt-1 inline-block h-2.5 w-2.5 rounded-full bg-foreground/50',
              )}
              role="status"
              aria-label="Saving"
            />
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-destructive">Error saving</span>
          )}
        </div>
      </div>

      <div className={cn('min-h-[50vh] pb-24', bodyFontClassName)}>
        <TipTapEditor
          content={note.content}
          onUpdate={handleUpdate}
          placeholder="Start writing your note..."
          noteId={note.id}
          contentRevision={note.updated_at}
          userId={user?.id ?? ''}
          noteMentionCandidates={noteMentionCandidates}
          attachments={attachments}
          bodyEditorRef={bodyEditorRef}
          proEntitled={notaProEntitled}
          emojiReplacerEnabled={emojiReplacerEnabled}
          onRefreshNotesList={() => {
            void refreshNotesList({ silent: true });
          }}
          onUploadFile={(file) =>
            uploadNoteAttachmentFile(note.id, user?.id ?? '', file)
          }
          acceptsFile={(file) => classifyNoteAttachmentFile(file) !== null}
          resolveNoteIdFromPath={parseNoteLinkPath}
          onNavigateToNote={(id) => {
            navigateFromLegacyPath(hrefForNote(id));
          }}
          getAbsoluteNoteUrl={absoluteUrlForNote}
          storageOps={storageOps}
          onImagePreviewRequest={(request) => {
            setLightboxImage({
              src: request.src,
              alt: request.alt,
              filename: request.filename,
            });
          }}
        />
      </div>
      <NoteImageLightbox
        open={lightboxImage !== null}
        image={lightboxImage}
        onClose={() => {
          setLightboxImage(null);
        }}
      />
    </div>
  );
}

export const NoteEditor = memo(NoteEditorImpl);
