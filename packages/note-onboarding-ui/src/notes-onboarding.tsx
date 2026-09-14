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
  QuestionnaireChoiceDescription,
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
import {
  LOCALE_OPTIONS,
  type SupportedLocale,
  type createTranslator,
} from '@getmadrid/i18n';

import { SidebarIconPreview } from './sidebar-icon-preview';

const SELECTABLE_LOCALE_OPTIONS = LOCALE_OPTIONS.filter(
  ({ value }) => value !== 'system',
);

const QUESTIONS = [
  {
    name: 'language',
    required: true,
    choices: [
      { value: 'system' },
      ...SELECTABLE_LOCALE_OPTIONS.map(({ value }) => ({ value })),
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
  {
    name: 'note-icons',
    required: true,
    choices: [{ value: 'yes' }, { value: 'no' }],
  },
  {
    name: 'folder-icons',
    required: true,
    choices: [{ value: 'yes' }, { value: 'no' }],
  },
] as const;

export type OnboardingPreferences = {
  locale?: SupportedLocale | null;
  show_writing_activity_graph?: boolean;
  open_todays_note_shortcut?: boolean;
  show_sidebar_note_icons?: boolean;
  show_sidebar_folder_icons?: boolean;
};

export type NotesOnboardingProps = {
  onComplete: (preferences: OnboardingPreferences) => Promise<void>;
  t: ReturnType<typeof createTranslator>['t'];
};

export function NotesOnboarding({
  onComplete,
  t,
}: NotesOnboardingProps): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [previewNoteIcons, setPreviewNoteIcons] = useState(true);
  const [previewFolderIcons, setPreviewFolderIcons] = useState(false);

  const complete = async (
    preferences: OnboardingPreferences = {},
  ): Promise<void> => {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaveFailed(false);

    try {
      await onComplete(preferences);
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
      show_sidebar_note_icons: answers.get('note-icons') === 'yes',
      show_sidebar_folder_icons: answers.get('folder-icons') === 'yes',
    });
  };

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-[5%] size-[38rem] rounded-full bg-[oklch(0.42_0.07_25_/_0.3)] blur-3xl" />
        <div className="absolute -right-1/4 bottom-[-35%] size-[42rem] rounded-full bg-[oklch(0.34_0.04_250_/_0.3)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,color-mix(in_oklab,var(--background)_72%,transparent)_58%,var(--background)_100%)]" />
      </div>

      <Dialog open onOpenChange={() => undefined}>
        <DialogContent
          blurBackdrop
          className="grid max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,52rem)] max-w-[52rem] grid-rows-[auto_minmax(0,1fr)] border-border/70 bg-background/95 p-0 shadow-2xl sm:max-w-[52rem] sm:rounded-2xl"
          showCloseButton={false}
        >
          <div className="space-y-2 border-b border-border/70 px-5 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
            <DialogTitle className="font-serif text-2xl sm:text-3xl">
              {t('Set up Madrid')}
            </DialogTitle>
            <DialogDescription className="max-w-lg">
              {t(
                'A few choices, then your notes. You can change these later in Settings.',
              )}
            </DialogDescription>
          </div>

          <Questionnaire
            className="min-h-0 space-y-6 overflow-y-auto px-5 pb-5 pt-4 sm:px-8 sm:pb-7 sm:pt-6"
            items={QUESTIONS}
            onSubmit={handleSubmit}
          >
            <QuestionnaireProgress
              className="text-sm text-muted-foreground"
              render={(props, { current, total }) => (
                <div {...props}>
                  {t('Question {current} of {total}', { current, total })}
                </div>
              )}
            />

            <QuestionnaireItem name="language" required>
              <QuestionnaireTitle>
                {t('How should Madrid speak to you?')}
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                {t('Pick a language for the app.')}
              </QuestionnaireDescription>
              <QuestionnaireChoices className="sm:grid-cols-2">
                <QuestionnaireChoice value="system">
                  {t('Use my device language')}
                  <QuestionnaireChoiceDescription>
                    {t('Follow the language set on this device.')}
                  </QuestionnaireChoiceDescription>
                </QuestionnaireChoice>
                {SELECTABLE_LOCALE_OPTIONS.map(({ label, value }) => (
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

            <QuestionnaireItem name="note-icons" required>
              <QuestionnaireTitle>
                {t('Should notes carry an icon?')}
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                {t(
                  'Each note in the sidebar can show a small page icon before its title.',
                )}
              </QuestionnaireDescription>
              <div className="grid gap-4 sm:grid-cols-5">
                <QuestionnaireChoices className="self-start sm:col-span-3">
                  <QuestionnaireChoice
                    value="yes"
                    onChange={() => {
                      setPreviewNoteIcons(true);
                    }}
                  >
                    {t('Show the icon')}
                  </QuestionnaireChoice>
                  <QuestionnaireChoice
                    value="no"
                    onChange={() => {
                      setPreviewNoteIcons(false);
                    }}
                  >
                    {t('Titles on their own')}
                  </QuestionnaireChoice>
                </QuestionnaireChoices>
                <SidebarIconPreview
                  className="sm:col-span-2"
                  showFolderIcons={previewFolderIcons}
                  showNoteIcons={previewNoteIcons}
                  t={t}
                />
              </div>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name="folder-icons" required>
              <QuestionnaireTitle>
                {t('How should folders be marked?')}
              </QuestionnaireTitle>
              <QuestionnaireDescription>
                {t(
                  'A folder icon in the colour you give the folder, or the smaller coloured dot.',
                )}
              </QuestionnaireDescription>
              <div className="grid gap-4 sm:grid-cols-5">
                <QuestionnaireChoices className="self-start sm:col-span-3">
                  <QuestionnaireChoice
                    value="yes"
                    onChange={() => {
                      setPreviewFolderIcons(true);
                    }}
                  >
                    {t('A folder icon in its colour')}
                  </QuestionnaireChoice>
                  <QuestionnaireChoice
                    value="no"
                    onChange={() => {
                      setPreviewFolderIcons(false);
                    }}
                  >
                    {t('A coloured dot')}
                  </QuestionnaireChoice>
                </QuestionnaireChoices>
                <SidebarIconPreview
                  className="sm:col-span-2"
                  showFolderIcons={previewFolderIcons}
                  showNoteIcons={previewNoteIcons}
                  t={t}
                />
              </div>
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
            <p
              className="px-5 pb-5 text-sm text-destructive sm:px-8 sm:pb-7"
              role="alert"
            >
              {t('Could not save your introduction. Please try again.')}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
