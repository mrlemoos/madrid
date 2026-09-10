'use client';

import { UserButton } from '@clerk/react';
import { useLayoutEffect, useMemo, useState, type JSX } from 'react';
import Link from 'next/link';
import { LOCALE_OPTIONS } from '@getmadrid/i18n';
import { ThemeMenu } from '@/components/theme-menu';
import { useRootLoaderData } from '@getmadrid/note-runtime/session-context';
import {
  useNotesDataActions,
  useNotesDataMeta,
} from '@getmadrid/note-runtime/notes-data-context';
import { submitUserPreferencesPatch } from '@getmadrid/note-runtime/use-sync-user-preferences';
import {
  useNotaPreferencesStore,
  type CursorVisualStyle,
} from '@getmadrid/note-runtime/stores/preferences';
import { ElectronUpdateSettingsSection } from '@getmadrid/electron-bridge-ui/update-settings-section';
import { NotaProSettingsSection } from '@/components/nota-pro-settings-section';
import { useIsElectron } from '@getmadrid/electron-bridge-ui/use-is-electron';
import { pathForScreen } from '@getmadrid/app-navigation-core/navigation';
import { navigatorLooksLikeApplePlatform } from '@/lib/navigator-apple-platform';
import { useNotaTranslator } from '@/lib/use-nota-translator';

/** `/notes/settings` — appearance, shortcuts, subscription, account. */
export default function NotesSettingsPage(): JSX.Element {
  const { user } = useRootLoaderData();
  const { notaProEntitled, userPreferences } = useNotesDataMeta();
  const { setUserPreferencesInState } = useNotesDataActions();
  const openTodaysNoteShortcut = useNotaPreferencesStore(
    (s) => s.openTodaysNoteShortcut,
  );
  const setOpenTodaysNoteShortcut = useNotaPreferencesStore(
    (s) => s.setOpenTodaysNoteShortcut,
  );
  const locale = useNotaPreferencesStore((s) => s.locale);
  const setLocale = useNotaPreferencesStore((s) => s.setLocale);
  const showNoteBacklinks = useNotaPreferencesStore((s) => s.showNoteBacklinks);
  const setShowNoteBacklinks = useNotaPreferencesStore(
    (s) => s.setShowNoteBacklinks,
  );
  const semanticSearchEnabled = useNotaPreferencesStore(
    (s) => s.semanticSearchEnabled,
  );
  const setSemanticSearchEnabled = useNotaPreferencesStore(
    (s) => s.setSemanticSearchEnabled,
  );
  const emojiReplacerEnabled = useNotaPreferencesStore(
    (s) => s.emojiReplacerEnabled,
  );
  const setEmojiReplacerEnabled = useNotaPreferencesStore(
    (s) => s.setEmojiReplacerEnabled,
  );
  const cursorVisualStyle = useNotaPreferencesStore((s) => s.cursorVisualStyle);
  const setCursorVisualStyle = useNotaPreferencesStore(
    (s) => s.setCursorVisualStyle,
  );
  const showWritingActivityGraph = useNotaPreferencesStore(
    (s) => s.showWritingActivityGraph,
  );
  const setShowWritingActivityGraph = useNotaPreferencesStore(
    (s) => s.setShowWritingActivityGraph,
  );
  const { t } = useNotaTranslator();
  const isElectron = useIsElectron();
  const cursorStyleOptions = useMemo(
    (): ReadonlyArray<{
      value: CursorVisualStyle;
      label: string;
      description: string;
    }> => [
      {
        value: 'line',
        label: t('Line'),
        description: t('Classic text cursor'),
      },
      {
        value: 'block',
        label: t('Block'),
        description: t('Solid cursor block'),
      },
    ],
    [t],
  );
  const [modDLabel, setModDLabel] = useState('⌘D');
  const [historyBackLabel, setHistoryBackLabel] = useState('⌘[');
  const [historyForwardLabel, setHistoryForwardLabel] = useState('⌘]');

  const shortcutsHref = pathForScreen({
    kind: 'notes',
    panel: 'shortcuts',
    noteId: null,
  });

  useLayoutEffect(() => {
    const isApple =
      navigatorLooksLikeApplePlatform() ||
      /\bMac OS X\b/i.test(navigator.userAgent);
    setModDLabel(isApple ? '⌘D' : 'Ctrl+D');
    setHistoryBackLabel(isApple ? '⌘[' : 'Ctrl+[');
    setHistoryForwardLabel(isApple ? '⌘]' : 'Ctrl+]');
  }, []);

  const accountSection = user ? (
    <div className="space-y-3" aria-labelledby="settings-account">
      <h2 id="settings-account" className="text-sm font-medium text-foreground">
        {t('Account')}
      </h2>
      <div className="space-y-4">
        <NotaProSettingsSection />
        <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t('Signed in as')}</p>
            <p
              className="mt-0.5 truncate text-sm font-medium text-foreground"
              title={user.email ?? undefined}
            >
              {user.email}
            </p>
          </div>
          <div className="flex shrink-0 justify-start sm:justify-end">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'size-9 ring-1 ring-border/40',
                  userButtonPopoverCard:
                    'border border-border/60 bg-background shadow-lg',
                  userButtonPopoverActionButton:
                    'text-foreground hover:bg-muted',
                  userButtonPopoverActionButtonText: 'text-foreground',
                },
              }}
            />
          </div>
        </div>
        {isElectron ? <ElectronUpdateSettingsSection /> : null}
      </div>
    </div>
  ) : isElectron ? (
    <div className="space-y-3" aria-labelledby="settings-account">
      <h2 id="settings-account" className="text-sm font-medium text-foreground">
        {t('Account')}
      </h2>
      <div>
        <ElectronUpdateSettingsSection />
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-normal text-foreground">
            {t('Settings')}
          </h1>
        </div>

        {!notaProEntitled ? accountSection : null}

        <section className="space-y-3" aria-labelledby="settings-general">
          <h2
            id="settings-general"
            className="text-sm font-medium text-foreground"
          >
            {t('General')}
          </h2>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20">
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <label
                  htmlFor="nota-locale"
                  className="text-sm text-foreground"
                >
                  {t('Language')}
                </label>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {t(
                    'If you leave this on system default, Madrid follows your device language.',
                  )}
                </p>
              </div>
              <select
                id="nota-locale"
                value={locale ?? 'system'}
                onChange={(event) => {
                  const next =
                    event.target.value === 'system' ? null : event.target.value;
                  setLocale(next);
                  submitUserPreferencesPatch(
                    { locale: next },
                    user?.id,
                    setUserPreferencesInState,
                    notaProEntitled,
                  );
                }}
                className="min-w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {LOCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-sm text-foreground">{t('Theme')}</p>
              </div>
              <ThemeMenu />
            </div>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="settings-editor">
          <h2
            id="settings-editor"
            className="text-sm font-medium text-foreground"
          >
            {t('Editor')}
          </h2>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20">
            <fieldset className="px-4 py-3">
              <legend className="text-sm text-foreground">
                {t('Editor cursor')}
              </legend>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {cursorStyleOptions.map((option) => {
                  const checked = cursorVisualStyle === option.value;
                  return (
                    <label
                      key={option.value}
                      htmlFor={`nota-cursor-style-${option.value}`}
                      className="flex cursor-pointer select-none items-center gap-2 text-sm text-foreground"
                    >
                      <input
                        id={`nota-cursor-style-${option.value}`}
                        name="nota-cursor-style"
                        type="radio"
                        checked={checked}
                        onChange={() => {
                          setCursorVisualStyle(option.value);
                        }}
                        className="size-4 accent-primary"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-snug text-muted-foreground">
                {
                  cursorStyleOptions.find(
                    (option) => option.value === cursorVisualStyle,
                  )?.description
                }
              </p>
            </fieldset>
            <label
              htmlFor="nota-show-note-backlinks"
              className="flex cursor-pointer select-none items-start gap-3 px-4 py-3"
            >
              <span className="order-1 flex-1">
                <span className="block text-sm text-foreground">
                  {t('Show backlinks on open notes')}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {t('Lists other notes that link to the note you have open.')}
                </span>
              </span>
              <input
                id="nota-show-note-backlinks"
                type="checkbox"
                checked={showNoteBacklinks}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowNoteBacklinks(checked);
                  submitUserPreferencesPatch(
                    { show_note_backlinks: checked },
                    user?.id,
                    setUserPreferencesInState,
                    notaProEntitled,
                  );
                }}
                className="order-2 mt-0.5 ml-auto size-4 shrink-0 rounded border border-input accent-primary"
              />
            </label>
            <label
              htmlFor="nota-delete-empty-folders"
              className="flex cursor-pointer select-none items-start gap-3 px-4 py-3"
            >
              <span className="order-1 flex-1">
                <span className="block text-sm text-foreground">
                  {t('Delete folder when it has no notes')}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {t(
                    'After you move or delete the last note in a folder, remove the empty folder automatically.',
                  )}
                </span>
              </span>
              <input
                id="nota-delete-empty-folders"
                type="checkbox"
                checked={userPreferences?.delete_empty_folders !== false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  submitUserPreferencesPatch(
                    { delete_empty_folders: checked },
                    user?.id,
                    setUserPreferencesInState,
                    notaProEntitled,
                  );
                }}
                className="order-2 mt-0.5 ml-auto size-4 shrink-0 rounded border border-input accent-primary"
              />
            </label>
            <label
              htmlFor="nota-emoji-replacer-enabled"
              className="flex cursor-pointer select-none items-start gap-3 px-4 py-3"
            >
              <span className="order-1 flex-1">
                <span className="block text-sm text-foreground">
                  {t('Replace typed smileys with emoji')}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {t('Turn off to keep text like :-) as plain characters.')}
                </span>
              </span>
              <input
                id="nota-emoji-replacer-enabled"
                type="checkbox"
                checked={emojiReplacerEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEmojiReplacerEnabled(checked);
                  submitUserPreferencesPatch(
                    { emoji_replacer_enabled: checked },
                    user?.id,
                    setUserPreferencesInState,
                    notaProEntitled,
                  );
                }}
                className="order-2 mt-0.5 ml-auto size-4 shrink-0 rounded border border-input accent-primary"
              />
            </label>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="settings-workflow">
          <h2
            id="settings-workflow"
            className="text-sm font-medium text-foreground"
          >
            {t('Workflow')}
          </h2>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20">
            <label
              htmlFor="nota-open-todays-note-shortcut"
              className="flex cursor-pointer select-none items-start gap-3 px-4 py-3"
            >
              <span className="order-1 flex-1">
                <span className="block text-sm text-foreground">
                  {t("Open today's note with {modKey}", { modKey: modDLabel })}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {t('When the shortcut is enabled in Settings.')}
                </span>
              </span>
              <input
                id="nota-open-todays-note-shortcut"
                type="checkbox"
                checked={openTodaysNoteShortcut}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOpenTodaysNoteShortcut(checked);
                  submitUserPreferencesPatch(
                    { open_todays_note_shortcut: checked },
                    user?.id,
                    setUserPreferencesInState,
                    notaProEntitled,
                  );
                }}
                className="order-2 mt-0.5 ml-auto size-4 shrink-0 rounded border border-input accent-primary"
              />
            </label>
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-sm text-foreground">
                {t(
                  'Go back and forward through recently visited notes with {backKey} and {forwardKey}.',
                  {
                    backKey: historyBackLabel,
                    forwardKey: historyForwardLabel,
                  },
                )}
              </p>
              <Link
                href={shortcutsHref}
                className="shrink-0 text-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                {t('View all shortcuts')}
              </Link>
            </div>
          </div>
        </section>

        {notaProEntitled ? (
          <section className="space-y-3" aria-labelledby="settings-search">
            <h2
              id="settings-search"
              className="text-sm font-medium text-foreground"
            >
              {t('Search & activity')}
            </h2>
            <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20">
              <label
                htmlFor="nota-semantic-search-enabled"
                className="flex cursor-pointer select-none items-start gap-3 px-4 py-3"
              >
                <span className="order-1 flex-1">
                  <span className="block text-sm text-foreground">
                    {t('Enable Semantic Search in ⌘K')}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {t(
                      'Reorders notes by meaning as you type. Turn off to use text matching only.',
                    )}
                  </span>
                </span>
                <input
                  id="nota-semantic-search-enabled"
                  type="checkbox"
                  checked={semanticSearchEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSemanticSearchEnabled(checked);
                    submitUserPreferencesPatch(
                      { semantic_search_enabled: checked },
                      user?.id,
                      setUserPreferencesInState,
                      notaProEntitled,
                    );
                  }}
                  className="order-2 mt-0.5 ml-auto size-4 shrink-0 rounded border border-input accent-primary"
                />
              </label>
              {user ? (
                <label className="flex cursor-pointer select-none items-start gap-3 px-4 py-3">
                  <span className="order-1 flex-1">
                    <span className="block text-sm text-foreground">
                      {t('Show writing activity graph when no note is open')}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                      {t(
                        'Appears below when you have no note selected. Cmd+K → "View writing activity" to jump there.',
                      )}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showWritingActivityGraph}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowWritingActivityGraph(checked);
                      submitUserPreferencesPatch(
                        { show_writing_activity_graph: checked },
                        user.id,
                        setUserPreferencesInState,
                        true,
                      );
                    }}
                    className="order-2 mt-0.5 ml-auto size-4 shrink-0 accent-primary"
                  />
                </label>
              ) : null}
            </div>
          </section>
        ) : null}

        {notaProEntitled ? accountSection : null}
      </div>
    </div>
  );
}
