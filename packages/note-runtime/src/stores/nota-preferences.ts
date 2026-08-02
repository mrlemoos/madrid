import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPreferences } from '~/types/database.types';
import {
  parseWritingActivityColor,
  parseWritingActivityDays,
  type WritingActivityColor,
} from '@/lib/writing-activity';

export type CursorVisualStyle = 'line' | 'block';

interface NotaPreferencesState {
  locale: string | null;
  openTodaysNoteShortcut: boolean;
  showNoteBacklinks: boolean;
  semanticSearchEnabled: boolean;
  emojiReplacerEnabled: boolean;
  cursorVisualStyle: CursorVisualStyle;
  /** Local toggle not yet persisted to Supabase (or last attempt failed while offline). */
  preferencesPendingSync: boolean;
  lastServerUpdatedAt: string | null;
  /** Local calendar date (YYYY-MM-DD) → note id; device-local only. */
  dailyNoteIdByLocalDate: Record<string, string>;

  showWritingActivityGraph: boolean;
  writingActivityColor: WritingActivityColor;
  writingActivityDays: Record<string, number>;

  setOpenTodaysNoteShortcut: (
    value: boolean,
    options?: { pendingSync?: boolean },
  ) => void;
  setLocale: (
    value: string | null,
    options?: { pendingSync?: boolean },
  ) => void;
  setShowNoteBacklinks: (
    value: boolean,
    options?: { pendingSync?: boolean },
  ) => void;
  setSemanticSearchEnabled: (
    value: boolean,
    options?: { pendingSync?: boolean },
  ) => void;
  setEmojiReplacerEnabled: (
    value: boolean,
    options?: { pendingSync?: boolean },
  ) => void;
  setCursorVisualStyle: (value: CursorVisualStyle) => void;
  setShowWritingActivityGraph: (
    value: boolean,
    options?: { pendingSync?: boolean },
  ) => void;
  setWritingActivityColor: (value: WritingActivityColor) => void;
  setWritingActivityDays: (days: Record<string, number>) => void;
  hydratePreferencesFromServer: (prefs: UserPreferences) => void;
  markPreferencesSynced: (prefs: UserPreferences) => void;
  setDailyNoteForLocalDate: (dateKey: string, noteId: string) => void;
  clearDailyNoteForLocalDate: (dateKey: string) => void;
}

export const useNotaPreferencesStore = create<NotaPreferencesState>()(
  persist(
    (set, get) => ({
      locale: null,
      openTodaysNoteShortcut: false,
      showNoteBacklinks: true,
      semanticSearchEnabled: true,
      emojiReplacerEnabled: true,
      cursorVisualStyle: 'line',
      preferencesPendingSync: false,
      lastServerUpdatedAt: null,
      dailyNoteIdByLocalDate: {},
      showWritingActivityGraph: false,
      writingActivityColor: 'blue',
      writingActivityDays: {},

      setOpenTodaysNoteShortcut: (value, options) =>
        set({
          openTodaysNoteShortcut: value,
          preferencesPendingSync:
            options?.pendingSync !== undefined ? options.pendingSync : true,
        }),

      setLocale: (value, options) =>
        set({
          locale: value,
          preferencesPendingSync:
            options?.pendingSync !== undefined ? options.pendingSync : true,
        }),

      setShowNoteBacklinks: (value, options) =>
        set({
          showNoteBacklinks: value,
          preferencesPendingSync:
            options?.pendingSync !== undefined ? options.pendingSync : true,
        }),

      setSemanticSearchEnabled: (value, options) =>
        set({
          semanticSearchEnabled: value,
          preferencesPendingSync:
            options?.pendingSync !== undefined ? options.pendingSync : true,
        }),

      setEmojiReplacerEnabled: (value, options) =>
        set({
          emojiReplacerEnabled: value,
          preferencesPendingSync:
            options?.pendingSync !== undefined ? options.pendingSync : true,
        }),

      setCursorVisualStyle: (value) =>
        set({
          cursorVisualStyle: value,
        }),

      setShowWritingActivityGraph: (value, options) =>
        set({
          showWritingActivityGraph: value,
          preferencesPendingSync:
            options?.pendingSync !== undefined ? options.pendingSync : true,
        }),

      setWritingActivityColor: (value) =>
        set({
          writingActivityColor: value,
          preferencesPendingSync: true,
        }),

      setWritingActivityDays: (days) =>
        set({
          writingActivityDays: days,
          preferencesPendingSync: true,
        }),

      hydratePreferencesFromServer: (prefs) => {
        if (get().preferencesPendingSync) {
          return;
        }
        set({
          locale: prefs.locale,
          openTodaysNoteShortcut: prefs.open_todays_note_shortcut,
          showNoteBacklinks: prefs.show_note_backlinks,
          semanticSearchEnabled: prefs.semantic_search_enabled,
          emojiReplacerEnabled: prefs.emoji_replacer_enabled,
          showWritingActivityGraph: prefs.show_writing_activity_graph,
          writingActivityColor: parseWritingActivityColor(
            prefs.writing_activity_color,
          ),
          writingActivityDays: parseWritingActivityDays(
            prefs.writing_activity_days,
          ),
          lastServerUpdatedAt: prefs.updated_at,
        });
      },

      markPreferencesSynced: (prefs) =>
        set({
          locale: prefs.locale,
          openTodaysNoteShortcut: prefs.open_todays_note_shortcut,
          showNoteBacklinks: prefs.show_note_backlinks,
          semanticSearchEnabled: prefs.semantic_search_enabled,
          emojiReplacerEnabled: prefs.emoji_replacer_enabled,
          showWritingActivityGraph: prefs.show_writing_activity_graph,
          writingActivityColor: parseWritingActivityColor(
            prefs.writing_activity_color,
          ),
          writingActivityDays: parseWritingActivityDays(
            prefs.writing_activity_days,
          ),
          preferencesPendingSync: false,
          lastServerUpdatedAt: prefs.updated_at,
        }),

      setDailyNoteForLocalDate: (dateKey, noteId) =>
        set((s) => ({
          dailyNoteIdByLocalDate: {
            ...s.dailyNoteIdByLocalDate,
            [dateKey]: noteId,
          },
        })),

      clearDailyNoteForLocalDate: (dateKey) =>
        set((s) => {
          const next = { ...s.dailyNoteIdByLocalDate };
          Reflect.deleteProperty(next, dateKey);
          return { dailyNoteIdByLocalDate: next };
        }),
    }),
    {
      name: 'nota-preferences',
      partialize: (state) => ({
        locale: state.locale,
        openTodaysNoteShortcut: state.openTodaysNoteShortcut,
        showNoteBacklinks: state.showNoteBacklinks,
        semanticSearchEnabled: state.semanticSearchEnabled,
        emojiReplacerEnabled: state.emojiReplacerEnabled,
        cursorVisualStyle: state.cursorVisualStyle,
        preferencesPendingSync: state.preferencesPendingSync,
        lastServerUpdatedAt: state.lastServerUpdatedAt,
        dailyNoteIdByLocalDate: state.dailyNoteIdByLocalDate,
        showWritingActivityGraph: state.showWritingActivityGraph,
        writingActivityColor: state.writingActivityColor,
        writingActivityDays: state.writingActivityDays,
      }),
    },
  ),
);
