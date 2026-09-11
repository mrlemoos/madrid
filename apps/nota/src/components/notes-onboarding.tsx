'use client';

import { useState, type JSX } from 'react';
import { Button } from '@getmadrid/design/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getmadrid/design/dialog';
import { Icon, type IconName } from '@getmadrid/design/icon';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { upsertUserPreferences } from '@getmadrid/data-source/models/user-preferences';
import {
  useNotesDataActions,
  useNotesDataMeta,
} from '@getmadrid/note-runtime/notes-data-context';
import { useNotaTranslator } from '@/lib/use-nota-translator';

const CURRENT_ONBOARDING_VERSION = 1;

const STEPS: ReadonlyArray<{
  title: 'Write anything' | 'Keep it tidy' | 'Find it later';
  description:
    | 'Start with the thought. The rest can follow.'
    | 'Folders make a little order when you want it.'
    | 'Use ⌘K or Ctrl+K to find notes and commands.';
  icon: IconName;
}> = [
  {
    title: 'Write anything',
    description: 'Start with the thought. The rest can follow.',
    icon: 'pen',
  },
  {
    title: 'Keep it tidy',
    description: 'Folders make a little order when you want it.',
    icon: 'folder',
  },
  {
    title: 'Find it later',
    description: 'Use ⌘K or Ctrl+K to find notes and commands.',
    icon: 'sparkles',
  },
];

export function NotesOnboarding(): JSX.Element | null {
  const { loading, notaProEntitled, userPreferences } = useNotesDataMeta();
  const { setUserPreferencesInState } = useNotesDataActions();
  const { t } = useNotaTranslator();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const shouldShow =
    !loading &&
    notaProEntitled &&
    userPreferences !== null &&
    userPreferences.onboarding_version !== CURRENT_ONBOARDING_VERSION;

  if (!shouldShow) {
    return null;
  }

  const currentStep = STEPS[step];
  const finalStep = step === STEPS.length - 1;

  const complete = async (): Promise<void> => {
    if (!userPreferences || saving) {
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      const row = await upsertUserPreferences(
        getBrowserClient(),
        userPreferences.user_id,
        {
          onboarding_version: CURRENT_ONBOARDING_VERSION,
        },
      );
      setUserPreferencesInState(row);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden rounded-2xl border-border/50 p-0 shadow-2xl"
      >
        <div className="bg-muted/50 px-7 pt-7 pb-6">
          <div className="mb-7 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('Welcome to Madrid')}</span>
            <span>{t('Step {step} of 3', { step: step + 1 })}</span>
          </div>
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-background text-foreground shadow-sm ring-1 ring-border/50">
            <Icon name={currentStep.icon} size={23} />
          </div>
          <DialogTitle className="font-serif text-3xl font-normal tracking-[-0.025em]">
            {t(currentStep.title)}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-[25rem] text-sm/relaxed text-muted-foreground">
            {t(currentStep.description)}
          </DialogDescription>
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-5">
          <Button
            variant="ghost"
            onClick={() => void complete()}
            disabled={saving}
          >
            {saving ? t('Saving…') : t('Skip for now')}
          </Button>
          <Button
            size="lg"
            onClick={() => {
              if (finalStep) {
                void complete();
              } else {
                setStep((current) => current + 1);
              }
            }}
            disabled={saving}
          >
            {finalStep ? t('Open my notes') : t('Continue')}
          </Button>
        </div>
        {saveFailed ? (
          <p role="alert" className="px-7 pb-5 text-xs text-destructive">
            {t("Couldn't save onboarding. Try again.")}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
