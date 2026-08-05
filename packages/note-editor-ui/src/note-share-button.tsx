import { useEffect, useRef, useState, type JSX } from 'react';
import { NotaButton } from '@nota/design/button';
import { NotaIcon } from '@nota/design/icon';
import { cn } from '@nota/design/utils';
import { getBrowserClient } from '@nota/data-source/supabase/browser';
import { useNoteEditorTranslator } from './use-note-editor-translator';
import { buildShareUrl, shareNote } from '@nota/data-source/note-share-client';

interface NoteShareButtonProps {
  noteId: string;
  shareToken: string | null;
  disabled?: boolean;
  /** Notify the editor so the note's cached `share_token` updates in place. */
  onShared?: (token: string) => void;
}

export function NoteShareButton({
  noteId,
  shareToken,
  disabled,
  onShared,
}: NoteShareButtonProps): JSX.Element {
  const { t } = useNoteEditorTranslator();
  const [token, setToken] = useState<string | null>(shareToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToken(shareToken);
  }, [shareToken, noteId]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const flashCopied = () => {
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      flashCopied();
    } catch {
      // Clipboard blocked (permissions/insecure context): leave state as-is.
    }
  };

  const handleClick = async () => {
    if (busy) return;
    if (token) {
      await copy(buildShareUrl(token));
      return;
    }
    setBusy(true);
    try {
      const result = await shareNote(getBrowserClient(), noteId, token);
      setToken(result.token);
      onShared?.(result.token);
      await copy(result.url);
    } catch {
      // Surface nothing intrusive; the button stays actionable to retry.
    } finally {
      setBusy(false);
    }
  };

  const label = token
    ? copied
      ? t('Link copied')
      : t('Shared')
    : busy
      ? t('Sharing…')
      : t('Share');

  return (
    <NotaButton
      type="button"
      variant={token ? 'outline' : 'ghost'}
      size="sm"
      disabled={disabled || busy}
      onClick={() => {
        void handleClick();
      }}
      aria-label={token ? t('Copy link again') : t('Share')}
      title={token ? t('Anyone with the link can view this note.') : undefined}
      className={cn(
        'gap-1.5 text-muted-foreground hover:text-foreground',
        token && 'text-foreground/80',
      )}
    >
      <NotaIcon name="link" size={14} strokeWidth={2} aria-hidden />
      {label}
    </NotaButton>
  );
}
