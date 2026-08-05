import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Note, NoteAttachment } from '@nota/database-types';
import { NoteEditor } from './note-editor';
import { NoteBacklinksPanel } from './note-backlinks-panel';
import { cn } from '@nota/web-design/utils';
import { noteSurfaceClassNames, parseNoteEditorSettings } from '@nota/editor';
import { getBrowserClient } from '@nota/data-source/supabase/browser';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import {
  getStoredNote,
  mergeNoteWithLocal,
  putServerNoteIfNotDirty,
  storedNoteToListRow,
} from '@nota/notes-offline';
import { fetchNoteRowAndAttachmentsParallel } from '@nota/data-source/note-detail-fetch';
import { getNote } from '@nota/data-source/models/notes';
import {
  listNoteAttachments,
  NOTE_PDFS_BUCKET,
} from '@nota/data-source/models/note-attachments';
import { replaceScreen } from '@nota/app-navigation-core/navigation';
import { shouldRefetchOpenNoteFromVaultList } from '@nota/app-navigation-core/open-note-vault-list-sync';
import {
  useNotesDataActions,
  useNotesDataMeta,
  useNotesDataVault,
} from '@nota/note-runtime/notes-data-context';
import { useAppSession } from '@nota/note-runtime/session-context';
import { ATTACHMENT_SIGNED_URL_TTL_SEC } from '@nota/data-source/attachment-signed-url-ttl';
import {
  getCachedNoteAttachmentSignedUrl,
  getValidNoteAttachmentSignedUrlCacheEntry,
  setCachedNoteAttachmentSignedUrl,
} from '@nota/data-source/attachment-signed-url-cache';
import { useStickyDocTitle } from '@nota/note-runtime/sticky-doc-title';
import { useNotaPreferencesStore } from '@nota/note-runtime/stores/preferences';
import { postSearchIndexNote } from '@nota/nota-server-client';
import { getClerkAccessToken } from '@nota/data-source/clerk-token-ref';
import { notaServerBaseUrl } from './vite-env';
import { noteBannerNoteSurfaceClass } from '@nota/notes-chrome-core/banner-chrome';

export function NoteDetailPanel({
  noteId,
}: {
  noteId: string;
}): React.ReactNode {
  const { notes } = useNotesDataVault();
  const { notaProEntitled, loading: vaultLoading } = useNotesDataMeta();
  const { patchNoteInList } = useNotesDataActions();
  const { user } = useAppSession();
  const { scrollRootRef } = useStickyDocTitle();
  const showNoteBacklinks = useNotaPreferencesStore((s) => s.showNoteBacklinks);
  const [note, setNote] = useState<Note | null>(null);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [fetchSettled, setFetchSettled] = useState(false);
  const [hadAuthenticatedUser, setHadAuthenticatedUser] = useState(false);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  const semanticIndexTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  /** List row for the open id :  avoids an empty state flash while the full fetch runs after a note switch. */
  const noteFromList = notes.find((n) => n.id === noteId) ?? null;
  const displayNote = note?.id === noteId ? note : noteFromList;

  const notFoundGateRef = useRef({
    userId: user?.id,
    vaultLoading,
    displayNote,
  });
  notFoundGateRef.current = { userId: user?.id, vaultLoading, displayNote };

  useEffect(() => {
    let cancelled = false;
    setAttachments([]);
    setFetchSettled(false);
    setHadAuthenticatedUser(false);

    async function load(): Promise<void> {
      let authedThisFetch = false;
      try {
        const client = getBrowserClient();
        const uid = user?.id;
        if (!uid) {
          if (!cancelled) {
            setNote(null);
            setAttachments([]);
          }
          return;
        }
        authedThisFetch = true;

        const finishFromLocal = async (): Promise<void> => {
          const local = await getStoredNote(uid, noteId);
          const rowFromList =
            notesRef.current.find((n) => n.id === noteId) ?? null;
          if (local && !local.pending_delete) {
            const merged = rowFromList
              ? mergeNoteWithLocal(rowFromList, local)
              : storedNoteToListRow(local);
            if (!cancelled) {
              setNote(merged);
              setAttachments([]);
            }
            return;
          }
          if (rowFromList) {
            if (!cancelled) {
              setNote(rowFromList);
              setAttachments([]);
            }
            return;
          }
          if (!cancelled) {
            setNote(null);
            setAttachments([]);
          }
        };

        if (!notaProEntitled) {
          await finishFromLocal();
          return;
        }

        try {
          const { row, attachments: atts } =
            await fetchNoteRowAndAttachmentsParallel(client, noteId, {
              getNote,
              listNoteAttachments,
            });
          if (row) {
            const local = await getStoredNote(uid, noteId);
            const merged = mergeNoteWithLocal(row, local);
            if (!cancelled) {
              setNote(merged);
              setAttachments(atts);
            }
            queueMicrotask(() => {
              if (!cancelled) {
                void putServerNoteIfNotDirty(uid, row);
              }
            });
            return;
          }
        } catch (e) {
          if (isLikelyOnline()) {
            console.error(e);
          }
        }

        await finishFromLocal();
      } finally {
        if (!cancelled) {
          setHadAuthenticatedUser(authedThisFetch);
          setFetchSettled(true);
        }
      }
    }

    void load().catch(() => {
      if (!cancelled) {
        setNote(null);
        setAttachments([]);
        setHadAuthenticatedUser(false);
        setFetchSettled(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [noteId, notaProEntitled, user?.id]);

  /** When the vault list row updates ahead of this panel (e.g. study notes + `patchNoteInList`), re-merge and refetch attachments. */
  useEffect(() => {
    if (
      !notaProEntitled ||
      !user?.id ||
      vaultLoading ||
      !fetchSettled ||
      !noteFromList ||
      noteFromList.id !== noteId
    ) {
      return;
    }
    if (!shouldRefetchOpenNoteFromVaultList(note, noteFromList)) {
      return;
    }

    const uid = user.id;
    const gen = ++openNoteFetchGenerationRef.current;

    void (async () => {
      try {
        const local = await getStoredNote(uid, noteId);
        const merged = mergeNoteWithLocal(noteFromList, local);
        const client = getBrowserClient();
        const atts = await listNoteAttachments(client, noteId);
        if (gen !== openNoteFetchGenerationRef.current) {
          return;
        }
        setNote(merged);
        setAttachments(atts);
      } catch (e) {
        if (isLikelyOnline()) {
          console.error(e);
        }
      }
    })();

    return () => {
      openNoteFetchGenerationRef.current += 1;
    };
  }, [
    fetchSettled,
    note,
    noteFromList,
    noteId,
    notaProEntitled,
    user?.id,
    vaultLoading,
  ]);

  useEffect(() => {
    if (
      !user?.id ||
      vaultLoading ||
      !fetchSettled ||
      !hadAuthenticatedUser ||
      displayNote
    ) {
      return;
    }
    // Defer so we do not read stale fetch flags in the same commit as the load effect
    // resetting `fetchSettled` / `hadAuthenticatedUser` (avoids notes → 404 → blank loops).
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      const g = notFoundGateRef.current;
      if (!g.userId || g.vaultLoading || g.displayNote) {
        return;
      }
      replaceScreen({ kind: 'notFound' });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [user?.id, vaultLoading, fetchSettled, hadAuthenticatedUser, displayNote]);

  // --- Banner signed URL ---
  const bannerAttachmentId = displayNote?.banner_attachment_id ?? null;
  const bannerAttachment = bannerAttachmentId
    ? (attachments.find((a) => a.id === bannerAttachmentId) ?? null)
    : null;
  const cachedBannerSignedUrl = useMemo(() => {
    if (!bannerAttachmentId) return null;
    return getCachedNoteAttachmentSignedUrl(
      bannerAttachmentId,
      bannerAttachment?.storage_path,
    );
  }, [bannerAttachmentId, bannerAttachment?.storage_path]);
  const [fetchedBannerSignedUrl, setFetchedBannerSignedUrl] = useState<
    string | null
  >(null);
  const bannerSignedUrl = cachedBannerSignedUrl ?? fetchedBannerSignedUrl;
  const bannerRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const openNoteFetchGenerationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setFetchedBannerSignedUrl(null);
    if (bannerRefreshTimerRef.current) {
      clearTimeout(bannerRefreshTimerRef.current);
      bannerRefreshTimerRef.current = null;
    }

    if (!bannerAttachmentId) {
      return;
    }

    const bannerId = bannerAttachmentId;

    const pathFromRow = bannerAttachment?.storage_path ?? null;
    const entry = pathFromRow
      ? getValidNoteAttachmentSignedUrlCacheEntry(bannerId, pathFromRow)
      : getValidNoteAttachmentSignedUrlCacheEntry(bannerId, undefined);

    const storagePath = pathFromRow ?? entry?.storagePath ?? null;

    if (!storagePath) {
      return () => {
        cancelled = true;
        if (bannerRefreshTimerRef.current) {
          clearTimeout(bannerRefreshTimerRef.current);
          bannerRefreshTimerRef.current = null;
        }
      };
    }

    const bannerStoragePath = storagePath;

    const scheduleRefresh = () => {
      if (bannerRefreshTimerRef.current) {
        clearTimeout(bannerRefreshTimerRef.current);
      }
      const ms = Math.max(
        5_000,
        Math.floor(ATTACHMENT_SIGNED_URL_TTL_SEC * 0.85 * 1000),
      );
      bannerRefreshTimerRef.current = setTimeout(() => void fetchUrl(), ms);
    };

    async function fetchUrl() {
      const client = getBrowserClient();
      const { data, error } = await client.storage
        .from(NOTE_PDFS_BUCKET)
        .createSignedUrl(bannerStoragePath, ATTACHMENT_SIGNED_URL_TTL_SEC);
      if (cancelled) return;
      if (error || !data.signedUrl) {
        setFetchedBannerSignedUrl(null);
        return;
      }
      setCachedNoteAttachmentSignedUrl(
        bannerId,
        bannerStoragePath,
        data.signedUrl,
        ATTACHMENT_SIGNED_URL_TTL_SEC,
      );
      setFetchedBannerSignedUrl(data.signedUrl);
      scheduleRefresh();
    }

    if (entry) {
      scheduleRefresh();
    } else {
      void fetchUrl();
    }

    return () => {
      cancelled = true;
      if (bannerRefreshTimerRef.current) {
        clearTimeout(bannerRefreshTimerRef.current);
        bannerRefreshTimerRef.current = null;
      }
    };
  }, [bannerAttachmentId, bannerAttachment?.storage_path]);

  // Paint the banner on the shared notes root so the image continues beneath
  // the translucent sidebar instead of stopping at the main panel edge.
  useEffect(() => {
    const main = scrollRootRef.current;
    if (!main) return;
    if (!bannerSignedUrl) return;
    const root = main.closest<HTMLElement>('.nota-notes-root');
    if (!root) return;
    root.classList.add('nota-notes-root--banner');
    root.style.backgroundImage = `url(${JSON.stringify(bannerSignedUrl)})`;
    root.style.backgroundSize = 'cover';
    root.style.backgroundPosition = 'center';
    root.style.backgroundAttachment = 'fixed';
    return () => {
      root.classList.remove('nota-notes-root--banner');
      root.style.backgroundImage = '';
      root.style.backgroundSize = '';
      root.style.backgroundPosition = '';
      root.style.backgroundAttachment = '';
    };
  }, [bannerSignedUrl, scrollRootRef]);

  const handleNoteUpdated = useCallback(
    (updatedNote: Note) => {
      setNote(updatedNote);
      patchNoteInList(updatedNote.id, updatedNote);

      const apiUrl = notaServerBaseUrl();
      if (!notaProEntitled || !apiUrl) {
        return;
      }

      if (semanticIndexTimerRef.current) {
        clearTimeout(semanticIndexTimerRef.current);
      }
      semanticIndexTimerRef.current = setTimeout(() => {
        semanticIndexTimerRef.current = null;
        void (async () => {
          const res = await postSearchIndexNote(
            apiUrl,
            await getClerkAccessToken(),
            { noteId: updatedNote.id },
          );
          if (!res.ok && process.env.NODE_ENV !== 'production') {
            console.warn('[semantic-index]', res.status, await res.text());
          }
        })();
      }, 45_000);
    },
    [notaProEntitled, patchNoteInList],
  );

  useEffect(() => {
    return () => {
      if (semanticIndexTimerRef.current) {
        clearTimeout(semanticIndexTimerRef.current);
        semanticIndexTimerRef.current = null;
      }
    };
  }, [noteId]);

  if (!displayNote) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-sm text-muted-foreground">
        Note not found or still loading…
      </div>
    );
  }

  const layout = noteSurfaceClassNames(
    parseNoteEditorSettings(displayNote.editor_settings),
  );

  return (
    <div
      className={cn(
        'relative',
        bannerSignedUrl ? 'px-4 py-10 md:px-8 md:py-16' : 'px-4 py-8',
      )}
    >
      <div
        className={cn(
          'mx-auto w-full transition-[max-width] duration-300 ease-in-out',
          layout.maxWidthClass,
          bannerSignedUrl && noteBannerNoteSurfaceClass,
        )}
      >
        <div>
          <NoteEditor
            note={displayNote}
            noteMentionCandidates={notes}
            attachments={attachments}
            titleFontClassName={layout.titleFontClass}
            bodyFontClassName={layout.bodyFontClass}
            onNoteUpdated={handleNoteUpdated}
            bannerSignedUrl={bannerSignedUrl}
          />
          {showNoteBacklinks ? (
            <div className={layout.bodyFontClass}>
              <NoteBacklinksPanel noteId={noteId} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
