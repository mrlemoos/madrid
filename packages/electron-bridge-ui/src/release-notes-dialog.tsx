import { useEffect, useMemo, useState, type JSX } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { NotaButton } from '@nota/web-design/button';
import { cn } from '@nota/web-design/utils';
import { fetchReleases } from '@nota/nota-server-client';
import { getClerkAccessToken } from '@nota/data-source/clerk-token-ref';
import { notaServerBaseUrl } from './vite-env.js';

type Release = {
  tagName: string;
  title: string;
  url: string;
  notes: string;
  publishedAt: string | null;
  prerelease: boolean;
};

function formatReleaseDate(value: string | null): string {
  if (!value) {
    return '';
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type ReleaseNotesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReleaseNotesDialog({
  open,
  onOpenChange,
}: ReleaseNotesDialogProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetchReleases(
          notaServerBaseUrl(),
          await getClerkAccessToken(),
          5,
        );
        if (!res.ok) {
          throw new Error('Could not load release notes.');
        }
        const payload = (await res.json()) as { releases?: Release[] };
        setReleases(Array.isArray(payload.releases) ? payload.releases : []);
      } catch (e) {
        setReleases([]);
        setError(
          e instanceof Error ? e.message : 'Could not load release notes.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const releaseItems = useMemo(
    () =>
      releases.map((release) => ({
        ...release,
        displayDate: formatReleaseDate(release.publishedAt),
      })),
    [releases],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-60 bg-black/40" />
        <Dialog.Popup
          className={cn(
            'fixed top-[10%] left-1/2 z-60 h-[min(80vh,42rem)] w-[min(100vw-2rem,44rem)] -translate-x-1/2 rounded-lg border border-border/60 bg-background text-foreground shadow-lg outline-none',
            'flex flex-col',
          )}
        >
          <div className="border-b border-border/50 px-4 py-3">
            <Dialog.Title className="font-medium text-foreground">
              What&apos;s new
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-muted-foreground text-sm">
              Last 5 releases from GitHub.
            </Dialog.Description>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <p className="text-muted-foreground text-sm">
                Loading release notes…
              </p>
            ) : null}

            {!loading && error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}

            {!loading && !error && releaseItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">No releases yet.</p>
            ) : null}

            {!loading && !error
              ? releaseItems.map((release) => (
                  <article
                    key={release.tagName}
                    className="mb-4 rounded-md border border-border/50 bg-card/40 p-3 last:mb-0"
                  >
                    <header className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">
                        {release.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {release.tagName}
                      </span>
                      {release.prerelease ? (
                        <span className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] uppercase">
                          RC
                        </span>
                      ) : null}
                      {release.displayDate ? (
                        <span className="ml-auto text-muted-foreground text-xs">
                          {release.displayDate}
                        </span>
                      ) : null}
                    </header>
                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap wrap-break-word font-sans text-sm">
                      {release.notes || 'No release notes.'}
                    </pre>
                    {release.url ? (
                      <div className="mt-2">
                        <a
                          href={release.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-sm underline underline-offset-2"
                        >
                          Open on GitHub
                        </a>
                      </div>
                    ) : null}
                  </article>
                ))
              : null}
          </div>

          <div className="border-t border-border/50 px-4 py-3">
            <div className="flex justify-end">
              <NotaButton
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Close
              </NotaButton>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
