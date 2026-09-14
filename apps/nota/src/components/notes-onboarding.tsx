'use client';

import type { JSX } from 'react';
import { useRouter } from 'next/navigation';

import { upsertUserPreferences } from '@getmadrid/data-source/models/user-preferences';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import {
  NotesOnboarding as NotesOnboardingView,
  type OnboardingPreferences,
} from '@getmadrid/note-onboarding-ui/notes-onboarding';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

import { useNotaTranslator } from '@/lib/use-nota-translator';
import { CURRENT_ONBOARDING_VERSION } from '@/lib/onboarding-version';

export function NotesOnboarding({ userId }: { userId: string }): JSX.Element {
  const router = useRouter();
  const setLocale = useNotaPreferencesStore((state) => state.setLocale);
  const setShowWritingActivityGraph = useNotaPreferencesStore(
    (state) => state.setShowWritingActivityGraph,
  );
  const setOpenTodaysNoteShortcut = useNotaPreferencesStore(
    (state) => state.setOpenTodaysNoteShortcut,
  );
  const setShowSidebarNoteIcons = useNotaPreferencesStore(
    (state) => state.setShowSidebarNoteIcons,
  );
  const setShowSidebarFolderIcons = useNotaPreferencesStore(
    (state) => state.setShowSidebarFolderIcons,
  );
  const { t } = useNotaTranslator();
  const complete = async (patch: OnboardingPreferences): Promise<void> => {
    await upsertUserPreferences(getBrowserClient(), userId, {
      onboarding_version: CURRENT_ONBOARDING_VERSION,
      ...patch,
    });
    if ('locale' in patch) {
      setLocale(patch.locale ?? null);
    }
    if ('show_writing_activity_graph' in patch) {
      setShowWritingActivityGraph(patch.show_writing_activity_graph ?? false);
    }
    if ('open_todays_note_shortcut' in patch) {
      setOpenTodaysNoteShortcut(patch.open_todays_note_shortcut ?? false);
    }
    if ('show_sidebar_note_icons' in patch) {
      setShowSidebarNoteIcons(patch.show_sidebar_note_icons ?? true);
    }
    if ('show_sidebar_folder_icons' in patch) {
      setShowSidebarFolderIcons(patch.show_sidebar_folder_icons ?? false);
    }
    router.replace('/notes');
    router.refresh();
  };

  return <NotesOnboardingView onComplete={complete} t={t} />;
}
