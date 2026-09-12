'use client';

import { useState, type JSX, type SyntheticEvent } from 'react';

import { Button } from '@getmadrid/design/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getmadrid/design/dialog';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@getmadrid/design/questionnaire';
import { LOCALE_OPTIONS, type SupportedLocale } from '@getmadrid/i18n';
import { upsertUserPreferences } from '@getmadrid/data-source/models/user-preferences';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import {
  useNotesDataActions,
  useNotesDataMeta,
} from '@getmadrid/note-runtime/notes-data-context';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

import { useNotaTranslator } from '@/lib/use-nota-translator';

const CURRENT_ONBOARDING_VERSION = 3;

const QUESTIONS = [
  {
    name: 'language',
    required: true,
    choices: [
      { value: 'system' },
      ...LOCALE_OPTIONS.map(({ value }) => ({ value })),
    ],
  },
  {
    name: 'writing-streak',
    required: true,
    choices: [{ value: 'yes' }, { value: 'no' }],
  },
  {
    name: 'daily-note',
    required: true,
    choices: [{ value: 'yes' }, { value: 'no' }],
  },
] as const;

export function NotesOnboarding(): JSX.Element | null {
  const { loading, notaProEntitled, userPreferences } = useNotesDataMeta();
  const { setUserPreferencesInState } = useNotesDataActions();
  const setLocale = useNotaPreferencesStore((state) => state.setLocale);
  const setShowWritingActivityGraph = useNotaPreferencesStore(
    (state) => state.setShowWritingActivityGraph,
  );
  const setOpenTodaysNoteShortcut = useNotaPreferencesStore(
    (state) => state.setOpenTodaysNoteShortcut,
  );
  const { t } = useNotaTranslator();
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

  const complete = async (
    patch: {
      locale?: SupportedLocale | null;
      show_writing_activity_graph?: boolean;
      open_todays_note_shortcut?: boolean;
    } = {},
  ): Promise<void> => {
    if (saving) {
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
          ...patch,
        },
      );
      setUserPreferencesInState(row);

      if ('locale' in patch) {
        setLocale(patch.locale ?? null);
      }
      if ('show_writing_activity_graph' in patch) {
        setShowWritingActivityGraph(patch.show_writing_activity_graph ?? false);
      }
      if ('open_todays_note_shortcut' in patch) {
        setOpenTodaysNoteShortcut(patch.open_todays_note_shortcut ?? false);
      }
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const answers = new FormData(event.currentTarget);
    const languageAnswer = answers.get('language');
    const selectedLocale =
      typeof languageAnswer === 'string' ? languageAnswer : 'system';

    void complete({
      locale:
        selectedLocale === 'system'
          ? null
          : (selectedLocale as SupportedLocale),
      show_writing_activity_graph: answers.get('writing-streak') === 'yes',
      open_todays_note_shortcut: answers.get('daily-note') === 'yes',
    });
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        blurBackdrop
        className="w-[min(100%-2rem,34rem)] border-border/70 bg-background/95 p-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="space-y-2 border-b border-border/70 px-6 pb-5 pt-6">
          <DialogTitle className="font-serif text-2xl">
            {t('Set up Madrid')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'A few choices, then your notes. You can change these later in Settings.',
            )}
          </DialogDescription>
        </div>

        <Questionnaire
          className="space-y-6 px-6 pb-6 pt-5"
          items={QUESTIONS}
          onSubmit={handleSubmit}
        >
          <QuestionnaireProgress className="text-sm text-muted-foreground">
            {({ current, total }: { current: number; total: number }) =>
              t('Question {current} of {total}', { current, total })
            }
          </QuestionnaireProgress>

          <QuestionnaireItem name="language" required>
            <QuestionnaireTitle>
              {t('How should Madrid speak to you?')}
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              {t('Pick a language for the app.')}
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice
                description={t('Follow the language set on this device.')}
                value="system"
              >
                {t('Use my device language')}
              </QuestionnaireChoice>
              {LOCALE_OPTIONS.map(({ label, value }) => (
                <QuestionnaireChoice key={value} value={value}>
                  {label}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="writing-streak" required>
            <QuestionnaireTitle>
              {t('Would you like a writing streak?')}
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              {t(
                'We can show your activity and current streak when no note is open.',
              )}
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="yes">
                {t('Yes, show my streak')}
              </QuestionnaireChoice>
              <QuestionnaireChoice value="no">
                {t('No, keep it out of the way')}
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="daily-note" required>
            <QuestionnaireTitle>
              {t('Would you like a daily note shortcut?')}
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              {t('Use ⌘D or Ctrl+D to open today’s note.')}
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="yes">
                {t('Yes, enable it')}
              </QuestionnaireChoice>
              <QuestionnaireChoice value="no">
                {t('No, not now')}
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious disabled={saving}>
              {t('Back')}
            </QuestionnairePrevious>
            <Button
              disabled={saving}
              onClick={() => void complete()}
              type="button"
              variant="ghost"
            >
              {saving ? t('Saving…') : t('Skip')}
            </Button>
            <QuestionnaireNext disabled={saving}>
              {t('Continue')}
            </QuestionnaireNext>
            <QuestionnaireSubmit disabled={saving}>
              {saving ? t('Saving…') : t('Finish')}
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>

        {saveFailed ? (
          <p className="px-6 pb-6 text-sm text-destructive" role="alert">
            {t('Could not save your introduction. Please try again.')}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
