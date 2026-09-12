'use client';

import { PricingTable } from '@clerk/react';
import { useRouter } from 'next/navigation';

import { Button } from '@getmadrid/design/button';

import { postNotaProInvalidate } from '@/lib/nota-server-client';
import { useNotaTranslator } from '@/lib/use-nota-translator';

export function OnboardingPaywall() {
  const router = useRouter();
  const { t } = useNotaTranslator();

  const refreshEntitlement = (): void => {
    void postNotaProInvalidate().finally(() => {
      router.refresh();
    });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-10 px-6 py-12">
      <section className="max-w-xl space-y-5">
        <p className="text-sm text-muted-foreground">{t('Madrid Pro')}</p>
        <h1 className="font-serif text-4xl tracking-tight">
          {t('A private place to think, and keep thinking.')}
        </h1>
        <p className="text-lg/relaxed text-muted-foreground">
          {t(
            'Madrid keeps notes, links, files, daily writing, and search in one calm workspace. Your work stays available across the web and Mac app.',
          )}
        </p>
        <ul className="space-y-2 text-sm/relaxed text-foreground">
          <li>{t('Capture a thought before it gets lost.')}</li>
          <li>
            {t('Connect notes without turning your workspace into a project.')}
          </li>
          <li>
            {t('Keep working when you are offline, then sync when you return.')}
          </li>
        </ul>
      </section>
      <div className="nota-clerk-pricing-table [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none">
        <PricingTable />
      </div>
      <Button
        className="w-fit"
        onClick={refreshEntitlement}
        type="button"
        variant="secondary"
      >
        {t('I completed checkout, refresh')}
      </Button>
    </main>
  );
}
