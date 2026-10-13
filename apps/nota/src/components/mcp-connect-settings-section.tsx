import { useEffect, useRef, useState, type JSX } from 'react';
import { Button } from '@getmadrid/design/button';
import { useNotaTranslator } from '../lib/use-nota-translator';

/** Settings row with the remote MCP server URL (`/api/mcp` on this origin). */
export function McpConnectSettingsSection(): JSX.Element {
  const { t } = useNotaTranslator();
  // Origin after mount: preview deploys and localhost get their own URL.
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/api/mcp`);
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // The field stays selectable, so a manual copy still works.
      return;
    }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <section className="space-y-3" aria-labelledby="settings-ai-apps">
      <h2 id="settings-ai-apps" className="text-sm font-medium text-foreground">
        {t('AI apps')}
      </h2>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <label htmlFor="nota-mcp-url" className="text-sm text-foreground">
          {t('MCP server URL')}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="nota-mcp-url"
            readOnly
            value={url}
            onFocus={(e) => {
              e.currentTarget.select();
            }}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 font-mono text-xs text-foreground"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!url}
            onClick={() => void copy()}
          >
            {copied ? t('Copied') : t('Copy')}
          </Button>
        </div>
        <p className="mt-2 text-xs leading-snug text-muted-foreground">
          {t(
            'Paste this address into an AI app that supports MCP, like Claude, and sign in with your Madrid account.',
          )}{' '}
          {t(
            "It can search, read and create notes, and add to the end of a note. It can't delete or change what you wrote.",
          )}
        </p>
      </div>
    </section>
  );
}
