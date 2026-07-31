import { useEffect, useRef, useState, type JSX } from 'react';
import { NotaButton } from '@nota/web-design/button';

import { cn } from '@/lib/utils';
import { getBrowserClient } from '@/lib/supabase/browser';
import { useNotaTranslator } from '@/lib/use-nota-translator';
import { buildShareUrl, shareNote } from '@/lib/note-share-client';

// ponytail: inline glyph -- the design-system icon set has no link/share icon,
// and a share button doesn't warrant a new asset + hover-motion entry.
function LinkGlyph(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 15l6-6" />
      <path d="M11 6l.5-.5a4.24 4.24 0 016 6l-2 2" />
      <path d="M13 18l-.5.5a4.24 4.24 0 01-6-6l2-2" />
    </svg>
  );
}

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
  const { t } = useNotaTranslator();
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
      <LinkGlyph />
      {label}
    </NotaButton>
  );
}
