import { Button } from '@getmadrid/design/button';
import { useCallback, useEffect, useState, type JSX } from 'react';
import {
  parseNotaUpdateStatusPayload,
  type NotaUpdateStatusPayload,
} from '@getmadrid/electron-bridge-core/update-status';
import { useElectronBridgeTranslator } from './use-electron-bridge-translator';

function statusMessage(
  status: NotaUpdateStatusPayload,
  t: ReturnType<typeof useElectronBridgeTranslator>['t'],
): string | null {
  switch (status.phase) {
    case 'idle':
      return null;
    case 'checking':
      return t('Checking for updates…');
    case 'available':
      return t('Update {version} is available.', { version: status.version });
    case 'not-available':
      return t("You're on the latest version.");
    case 'downloading':
      return t('Downloading update… {percent}%', {
        percent: status.percent,
      });
    case 'downloaded':
      return t('Update ready. Restart Madrid to finish installing.');
    case 'error':
      return t('Update check failed: {message}', { message: status.message });
    case 'unavailable':
      return t('Updates are only checked in the packaged Mac app.');
  }
}

export function ElectronUpdateSettingsSection(): JSX.Element | null {
  const { t } = useElectronBridgeTranslator();
  const [status, setStatus] = useState<NotaUpdateStatusPayload>({
    phase: 'idle',
  });

  const shell = window.nota;

  useEffect(() => {
    if (!shell || typeof shell.subscribeUpdateStatus !== 'function') {
      return;
    }
    return shell.subscribeUpdateStatus((raw: unknown) => {
      const parsed = parseNotaUpdateStatusPayload(raw);
      if (parsed) {
        setStatus(parsed);
      }
    });
  }, [shell]);

  const runCheck = useCallback(() => {
    if (!shell || typeof shell.checkForUpdates !== 'function') {
      return;
    }
    void shell.checkForUpdates();
  }, [shell]);

  const runQuitAndInstall = useCallback(() => {
    if (!shell || typeof shell.quitAndInstall !== 'function') {
      return;
    }
    void shell.quitAndInstall();
  }, [shell]);

  if (
    !shell ||
    typeof shell.checkForUpdates !== 'function' ||
    typeof shell.subscribeUpdateStatus !== 'function'
  ) {
    return null;
  }

  const message = statusMessage(status, t);
  const checkDisabled =
    status.phase === 'checking' || status.phase === 'downloading';

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground">
        {t('Desktop app updates')}
      </h2>
      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {t('Madrid checks GitHub Releases for the latest signed Mac build.')}
        </p>
        {message ? (
          <p className="text-sm text-foreground" role="status">
            {message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={checkDisabled}
            onClick={runCheck}
          >
            {t('Check for updates')}
          </Button>
          {status.phase === 'downloaded' ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={runQuitAndInstall}
            >
              {t('Restart and update')}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
