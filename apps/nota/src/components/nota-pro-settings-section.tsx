import { PricingTable } from '@clerk/react';
import { useCallback, useState, type JSX } from 'react';
import { Button } from '@getmadrid/design/button';
import { LoadingStatus } from '@getmadrid/design/spinner';
import {
  useNotesDataActions,
  useNotesDataMeta,
} from '@getmadrid/note-runtime/notes-data-context';
import { postNotaProInvalidate } from '../lib/nota-server-client';
import { useNotaTranslator } from '../lib/use-nota-translator';

export function NotaProSettingsSection(): JSX.Element {
  const { t } = useNotaTranslator();
  const { notaProEntitled, loading } = useNotesDataMeta();
  const { refreshNotesList } = useNotesDataActions();
  const [refreshBusy, setRefreshBusy] = useState(false);

  const runRefresh = useCallback(() => {
    setRefreshBusy(true);
    void (async () => {
      try {
        await postNotaProInvalidate();
        await refreshNotesList();
      } catch {
        // Nothing to say beyond re-enabling the button: the reader can retry,
        // and an unhandled rejection here would surface as a dev error overlay.
      } finally {
        setRefreshBusy(false);
      }
    })();
  }, [refreshNotesList]);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        {t('Subscription')}
      </h3>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/10">
        {loading ? (
          <div className="px-4 py-3">
            <LoadingStatus
              className="justify-start text-left"
              label={t('Loading subscription status…')}
              spinnerSize="sm"
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {notaProEntitled
                    ? t('Active subscription')
                    : t('No active subscription')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notaProEntitled
                    ? t('Your plan is active.')
                    : t('Choose a plan to use Madrid.')}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={refreshBusy}
                onClick={runRefresh}
              >
                {refreshBusy
                  ? t('Refreshing…')
                  : notaProEntitled
                    ? t('Refresh status')
                    : t('I completed checkout, refresh')}
              </Button>
            </div>
            {notaProEntitled ? (
              <details className="border-t border-border/60">
                <summary className="cursor-pointer px-4 py-3 text-sm text-muted-foreground">
                  {t('Manage subscription')}
                </summary>
                <div className="border-t border-border/60 px-4 py-3">
                  <div className="nota-clerk-pricing-table [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none">
                    <PricingTable />
                  </div>
                </div>
              </details>
            ) : (
              <div className="border-t border-border/60 px-4 py-3">
                <div className="nota-clerk-pricing-table [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none">
                  <PricingTable />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
