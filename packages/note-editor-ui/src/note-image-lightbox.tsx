import { Button } from '@nota/design/button';
import { cn } from '@nota/design/utils';
import { usePrefersReducedMotion } from '@nota/nota-motion-ui/motion';
import { useIsElectron } from '@nota/electron-bridge-ui/use-is-electron';
import { useEffect, useRef, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';

export type NoteImageLightboxImage = {
  src: string;
  alt: string;
  filename: string;
};

type NoteImageLightboxProps = {
  open: boolean;
  image: NoteImageLightboxImage | null;
  onClose: () => void;
};

const EXIT_MS = 200;

export function NoteImageLightbox({
  open,
  image,
  onClose,
}: NoteImageLightboxProps): JSX.Element | null {
  const isElectron = useIsElectron();
  const reducedMotion = usePrefersReducedMotion();
  const present = open && image !== null;

  const [rendered, setRendered] = useState(present);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const lastImageRef = useRef<NoteImageLightboxImage | null>(null);
  if (image) {
    lastImageRef.current = image;
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let mountFrame: number | undefined;

    if (present) {
      setRendered(true);
      setClosing(false);
      setMounted(false);
      mountFrame = requestAnimationFrame(() => {
        setMounted(true);
      });
    } else if (rendered) {
      setClosing(true);
      setMounted(false);
      exitTimer = setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, EXIT_MS);
    }

    return () => {
      if (mountFrame !== undefined) {
        cancelAnimationFrame(mountFrame);
      }
      if (exitTimer !== undefined) {
        clearTimeout(exitTimer);
      }
    };
  }, [present, rendered]);

  const displayImage = lastImageRef.current;

  if (!rendered || !displayImage || typeof document === 'undefined') {
    return null;
  }

  const motionAttrs = {
    'data-mounted': mounted ? 'true' : 'false',
    'data-closing': closing ? 'true' : 'false',
    'data-reduced-motion': reducedMotion ? 'true' : 'false',
  } as const;

  return createPortal(
    <div
      className="nota-image-lightbox-backdrop fixed inset-0 z-70 bg-background/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview for ${displayImage.filename}`}
      data-testid="note-image-lightbox-backdrop"
      tabIndex={-1}
      {...motionAttrs}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header
          className={cn(
            'nota-image-lightbox-chrome flex items-center justify-between gap-3 px-4 py-3 sm:px-6',
            isElectron
              ? 'pt-[max(0.75rem,env(safe-area-inset-top))] pl-20'
              : 'pt-[max(0.75rem,env(safe-area-inset-top))]',
          )}
          {...motionAttrs}
        >
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {displayImage.filename}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close image view"
          >
            Close
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-8">
          <div
            className="nota-image-lightbox-image flex max-h-full w-full max-w-full items-center justify-center"
            {...motionAttrs}
          >
            <img
              src={displayImage.src}
              alt={displayImage.alt}
              className="max-h-full w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
