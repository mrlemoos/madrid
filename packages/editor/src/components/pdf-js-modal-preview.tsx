import { useEffect, useRef, useState } from 'react';
import { LoadingStatus } from '@getmadrid/design/spinner';
import { cn } from '@getmadrid/design/utils';
import { formatPinchZoom, PINCH_ZOOM_DEFAULT } from '../lib/pinch-zoom';
// Asset URL for the PDF.js worker. `new URL(..., import.meta.url)` is the
// bundler-native way to emit and reference the asset (replaces Vite's `?url`).
const pdfjsWorkerUrl = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/**
 * Render resolution of each page canvas.
 *
 * @remarks
 * Pages are laid out at the container width and zoomed with CSS, so this only
 * sets how much detail there is to zoom into: at `2` a page is ~1224px of
 * bitmap shown across a ~900px sheet, which stays crisp on a Retina panel up to
 * roughly 2× zoom and softens past it.
 *
 * ponytail: every page is rasterised up front (~7.75MB each), so a long
 * document is heavy. Render only the pages near the viewport if that bites.
 */
const PDF_RENDER_SCALE = 2;

type PdfJsModalPreviewProps = {
  url: string;
  documentTitle: string;
  className?: string;
  /** Page width as a multiple of the container width. @defaultValue 1 */
  zoom?: number;
  onRenderFailed: () => void;
};

export function PdfJsModalPreview({
  url,
  documentTitle,
  className,
  zoom = PINCH_ZOOM_DEFAULT,
  onRenderFailed,
}: PdfJsModalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    void (async () => {
      setPhase('loading');
      container.replaceChildren();

      try {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const buf = await res.arrayBuffer();
        if (cancelled) return;

        const pdf = await getDocument({ data: buf }).promise;
        const frag = document.createDocumentFragment();

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) throw new Error('no canvas context');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          // Lay out at the container width; `zoom` scales the container, not this.
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.className = 'mb-4 bg-white shadow-sm';
          canvas.setAttribute('aria-label', `${documentTitle} page ${i}`);
          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
          frag.appendChild(canvas);
        }

        if (cancelled) return;
        container.appendChild(frag);
        setPhase('ready');
      } catch {
        if (!cancelled) {
          onRenderFailed();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, documentTitle, onRenderFailed]);

  return (
    <div
      className={cn('flex min-h-[min(80vh,720px)] flex-col', className)}
      style={{ width: formatPinchZoom(zoom), minWidth: '100%' }}
    >
      {phase === 'loading' ? (
        <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
          <LoadingStatus label="Loading preview…" />
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="flex flex-col items-center px-4 pt-2 pb-4"
        hidden={phase !== 'ready'}
      />
    </div>
  );
}
