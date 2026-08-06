import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/react';
import type { UserPreferences } from '@nota/database-types';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import { useNotaPreferencesStore } from '../stores/nota-preferences';
import { getBrowserClient } from '@nota/data-source/supabase/browser';
import {
  upsertUserPreferences,
  type UserPreferencesUpsertPatch,
} from '@nota/data-source/models/user-preferences';

/**
 * Hydrates shortcut preference from server data, flushes pending toggles when online,
 * and notifies the notes data layer when a server row is committed.
 */
export function useSyncUserPreferences(
  userPreferencesFromServer: UserPreferences | null,
  userId: string | undefined,
  onServerRowCommitted?: (row: UserPreferences) => void,
  cloudSyncEnabled = true,
): void {
  const hydratePreferencesFromServer = useNotaPreferencesStore(
    (s) => s.hydratePreferencesFromServer,
  );
  const markPreferencesSynced = useNotaPreferencesStore(
    (s) => s.markPreferencesSynced,
  );

  const hydratedLoaderRef = useRef<UserPreferences | null>(null);

  useEffect(() => {
    if (!userPreferencesFromServer) {
      return;
    }
    if (
      hydratedLoaderRef.current &&
      hydratedLoaderRef.current.updated_at ===
        userPreferencesFromServer.updated_at &&
      hydratedLoaderRef.current.locale === userPreferencesFromServer.locale &&
      hydratedLoaderRef.current.open_todays_note_shortcut ===
        userPreferencesFromServer.open_todays_note_shortcut &&
      hydratedLoaderRef.current.show_note_backlinks ===
        userPreferencesFromServer.show_note_backlinks &&
      hydratedLoaderRef.current.semantic_search_enabled ===
        userPreferencesFromServer.semantic_search_enabled &&
      hydratedLoaderRef.current.emoji_replacer_enabled ===
        userPreferencesFromServer.emoji_replacer_enabled &&
      hydratedLoaderRef.current.delete_empty_folders ===
        userPreferencesFromServer.delete_empty_folders &&
      hydratedLoaderRef.current.show_writing_activity_graph ===
        userPreferencesFromServer.show_writing_activity_graph &&
      hydratedLoaderRef.current.writing_activity_color ===
        userPreferencesFromServer.writing_activity_color
      // writing_activity_days intentionally omitted from cheap equality (large + mutated separately)
    ) {
      return;
    }
    hydratedLoaderRef.current = userPreferencesFromServer;
    hydratePreferencesFromServer(userPreferencesFromServer);
  }, [userPreferencesFromServer, hydratePreferencesFromServer]);

  useEffect(() => {
    const tryFlush = (): void => {
      if (!userId || !isLikelyOnline() || !cloudSyncEnabled) {
        return;
      }
      const {
        preferencesPendingSync,
        locale,
        openTodaysNoteShortcut,
        showNoteBacklinks,
        semanticSearchEnabled,
        emojiReplacerEnabled,
        showWritingActivityGraph,
        writingActivityColor,
        writingActivityDays,
      } = useNotaPreferencesStore.getState();
      if (!preferencesPendingSync) {
        return;
      }
      void (async () => {
        try {
          const client = getBrowserClient();
          const row = await upsertUserPreferences(client, userId, {
            locale,
            open_todays_note_shortcut: openTodaysNoteShortcut,
            show_note_backlinks: showNoteBacklinks,
            semantic_search_enabled: semanticSearchEnabled,
            emoji_replacer_enabled: emojiReplacerEnabled,
            show_writing_activity_graph: showWritingActivityGraph,
            writing_activity_color: writingActivityColor,
            writing_activity_days: writingActivityDays,
          });
          markPreferencesSynced(row);
          onServerRowCommitted?.(row);
        } catch {
          /* keep pending */
        }
      })();
    };

    window.addEventListener('online', tryFlush);
    const intervalId = window.setInterval(tryFlush, 60_000);
    tryFlush();

    return () => {
      window.removeEventListener('online', tryFlush);
      window.clearInterval(intervalId);
    };
  }, [userId, markPreferencesSynced, onServerRowCommitted, cloudSyncEnabled]);
}

/** Minimal Clerk user shape the display-name snapshot needs. */
export type ClerkDisplayNameSource = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

/**
 * Resolve the author display name from Clerk: `fullName` → first+last →
 * username. Returns null when nothing usable is set. Pure (unit-tested).
 */
export function resolveClerkDisplayName(
  user: ClerkDisplayNameSource | null | undefined,
): string | null {
  if (!user) {
    return null;
  }
  const full = user.fullName?.trim();
  if (full) {
    return full;
  }
  const firstLast = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  if (firstLast) {
    return firstLast;
  }
  const username = user.username?.trim();
  return username || null;
}

/**
 * Snapshots the signed-in Clerk user's display name onto `user_preferences` so
 * the anon Share Card RPC can render `{author} shared {title}` without a Clerk
 * Backend call. Writes only when the resolved name differs from the server row.
 */
export function useSyncClerkDisplayName(
  userPreferencesFromServer: UserPreferences | null,
  userId: string | undefined,
  onServerRowCommitted?: (row: UserPreferences) => void,
  cloudSyncEnabled = true,
): void {
  const { user } = useUser();

  useEffect(() => {
    if (
      !userId ||
      !userPreferencesFromServer ||
      !isLikelyOnline() ||
      !cloudSyncEnabled
    ) {
      return;
    }
    const displayName = resolveClerkDisplayName(user);
    if (
      !displayName ||
      displayName === userPreferencesFromServer.display_name
    ) {
      return;
    }
    void (async () => {
      try {
        const client = getBrowserClient();
        const row = await upsertUserPreferences(client, userId, {
          display_name: displayName,
        });
        useNotaPreferencesStore.getState().markPreferencesSynced(row);
        onServerRowCommitted?.(row);
      } catch {
        /* keep trying on next render/session */
      }
    })();
  }, [
    user,
    userId,
    userPreferencesFromServer,
    onServerRowCommitted,
    cloudSyncEnabled,
  ]);
}

export type UserPreferencesSyncPatch = Omit<
  UserPreferencesUpsertPatch,
  'welcome_seeded'
>;

/**
 * Persists the given preference fields when online and cloud sync is enabled.
 */
export function submitUserPreferencesPatch(
  patch: Partial<UserPreferencesSyncPatch>,
  userId: string | undefined,
  onServerRowCommitted?: (row: UserPreferences) => void,
  cloudSyncEnabled = true,
): void {
  if (!userId || !isLikelyOnline() || !cloudSyncEnabled) {
    return;
  }
  if (Object.keys(patch).length === 0) {
    return;
  }
  void (async () => {
    try {
      const client = getBrowserClient();
      const row = await upsertUserPreferences(client, userId, patch);
      useNotaPreferencesStore.getState().markPreferencesSynced(row);
      onServerRowCommitted?.(row);
    } catch {
      /* ignore */
    }
  })();
}
