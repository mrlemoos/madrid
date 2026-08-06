import { describe, expect, it, vi } from 'vitest';
import type { StoredNote } from '@nota/notes-offline';
import type { Folder, Note, UserPreferences } from '@nota/database-types';
import {
  loadVault,
  type VaultLoadPorts,
  type VaultLoadResult,
} from './notes-vault-load';

function makeNote(id: string, updatedAt: string): Note {
  return {
    id,
    title: `Note ${id}`,
    updated_at: updatedAt,
  } as Note;
}

function makeStoredNote(
  id: string,
  updatedAt: string,
  overrides?: Partial<StoredNote>,
): StoredNote {
  return {
    id,
    user_id: 'user-1',
    title: `Note ${id}`,
    content: null,
    updated_at: updatedAt,
    dirty: false,
    pending_delete: false,
    ...overrides,
  } as StoredNote;
}

function makePorts(overrides?: {
  entitlement?: Partial<VaultLoadPorts['entitlement']>;
  remote?: Partial<VaultLoadPorts['remote']>;
  local?: Partial<VaultLoadPorts['local']>;
  isLikelyOnline?: VaultLoadPorts['isLikelyOnline'];
}): VaultLoadPorts {
  return {
    entitlement: {
      fetchEntitled: vi.fn(async () => true),
      readSession: vi.fn(() => false),
      syncSession: vi.fn(),
      ...overrides?.entitlement,
    },
    remote: {
      listNotes: vi.fn(async (): Promise<Note[]> => []),
      listFolders: vi.fn(async (): Promise<Folder[]> => []),
      getPrefs: vi.fn(
        async (): Promise<UserPreferences> =>
          ({ user_id: 'user-1', welcome_seeded: true }) as UserPreferences,
      ),
      ...overrides?.remote,
    },
    local: {
      listStoredNotes: vi.fn(async (): Promise<StoredNote[]> => []),
      syncServerNotes: vi.fn(async () => undefined),
      ...overrides?.local,
    },
    isLikelyOnline: overrides?.isLikelyOnline ?? (() => true),
  };
}

describe('loadVault', () => {
  it('returns signed-out without touching any port when userId is missing', async () => {
    // Arrange
    const ports = makePorts();

    // Act
    const result = await loadVault({ userId: undefined, ports });

    // Assert
    expect(result).toEqual({ kind: 'signed-out' });
    expect(ports.entitlement.fetchEntitled).not.toHaveBeenCalled();
  });

  it('returns not-entitled and syncs the session flag when server says not entitled', async () => {
    // Arrange
    const ports = makePorts({
      entitlement: { fetchEntitled: vi.fn(async () => false) },
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result).toEqual({ kind: 'not-entitled' });
    expect(ports.entitlement.syncSession).toHaveBeenCalledWith(false);
    expect(ports.remote.listNotes).not.toHaveBeenCalled();
  });

  it('returns loaded with merged notes, folders, and prefs when entitled', async () => {
    // Arrange
    const serverNote = makeNote('a', '2026-01-02T00:00:00Z');
    const folder = { id: 'f1', name: 'Folder' } as Folder;
    const prefs = {
      user_id: 'user-1',
      welcome_seeded: true,
    } as UserPreferences;
    const ports = makePorts({
      remote: {
        listNotes: vi.fn(async () => [serverNote]),
        listFolders: vi.fn(async () => [folder]),
        getPrefs: vi.fn(async () => prefs),
      },
      local: {
        listStoredNotes: vi.fn(async () => [
          makeStoredNote('a', '2026-01-02T00:00:00Z'),
        ]),
      },
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') {
      return;
    }
    expect(result.notes.map((n) => n.id)).toEqual(['a']);
    expect(result.folders).toEqual([folder]);
    expect(result.prefs).toEqual(prefs);
    expect(result.loadError).toBeUndefined();
    expect(ports.entitlement.syncSession).toHaveBeenCalledWith(true);
    expect(ports.local.syncServerNotes).toHaveBeenCalledWith('user-1', [
      serverNote,
    ]);
  });

  it('keeps locally stored notes and sets loadError when the notes fetch fails', async () => {
    // Arrange
    const ports = makePorts({
      remote: {
        listNotes: vi.fn(async () => {
          throw new Error('boom');
        }),
      },
      local: {
        listStoredNotes: vi.fn(async () => [
          makeStoredNote('local-1', '2026-01-01T00:00:00Z', { dirty: true }),
        ]),
      },
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') {
      return;
    }
    expect(result.loadError).toBe('Failed to load notes');
    expect(result.notes.map((n) => n.id)).toEqual(['local-1']);
  });

  it('falls back to default prefs and empty folders when those fetches fail', async () => {
    // Arrange
    const ports = makePorts({
      remote: {
        listFolders: vi.fn(async () => {
          throw new Error('boom');
        }),
        getPrefs: vi.fn(async () => {
          throw new Error('boom');
        }),
      },
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') {
      return;
    }
    expect(result.folders).toEqual([]);
    expect(result.prefs?.welcome_seeded).toBe(false);
    expect(result.prefs?.user_id).toBe('user-1');
    expect(result.loadError).toBeUndefined();
  });

  it('recovers offline from IndexedDB without an error when the session says entitled', async () => {
    // Arrange
    const ports = makePorts({
      entitlement: {
        fetchEntitled: vi.fn(async () => {
          throw new Error('network down');
        }),
        readSession: vi.fn(() => true),
      },
      local: {
        listStoredNotes: vi.fn(async () => [
          makeStoredNote('b', '2026-01-03T00:00:00Z'),
          makeStoredNote('gone', '2026-01-04T00:00:00Z', {
            pending_delete: true,
          }),
        ]),
      },
      isLikelyOnline: () => false,
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result).toMatchObject({
      kind: 'recovered',
      entitled: true,
      loadError: undefined,
    });
    if (result.kind !== 'recovered') {
      return;
    }
    expect(result.notes.map((n) => n.id)).toEqual(['b']);
  });

  it('recovers offline to an empty vault when the session says not entitled', async () => {
    // Arrange
    const ports = makePorts({
      entitlement: {
        fetchEntitled: vi.fn(async () => {
          throw new Error('network down');
        }),
        readSession: vi.fn(() => false),
      },
      isLikelyOnline: () => false,
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result).toEqual({
      kind: 'recovered',
      entitled: false,
      notes: [],
      loadError: undefined,
    });
  });

  it('recovers online with an error and IndexedDB notes when entitlement fetch fails but session says entitled', async () => {
    // Arrange
    const ports = makePorts({
      entitlement: {
        fetchEntitled: vi.fn(async () => {
          throw new Error('server 500');
        }),
        readSession: vi.fn(() => true),
      },
      local: {
        listStoredNotes: vi.fn(async () => [
          makeStoredNote('c', '2026-01-05T00:00:00Z'),
        ]),
      },
      isLikelyOnline: () => true,
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result).toMatchObject({
      kind: 'recovered',
      entitled: true,
      loadError: 'Failed to load notes',
    });
    if (result.kind !== 'recovered') {
      return;
    }
    expect(result.notes.map((n) => n.id)).toEqual(['c']);
  });

  it('recovers online with an error and empty vault when entitlement fetch fails and session says not entitled', async () => {
    // Arrange
    const ports = makePorts({
      entitlement: {
        fetchEntitled: vi.fn(async () => {
          throw new Error('server 500');
        }),
        readSession: vi.fn(() => false),
      },
      isLikelyOnline: () => true,
    });

    // Act
    const result = await loadVault({ userId: 'user-1', ports });

    // Assert
    expect(result).toEqual({
      kind: 'recovered',
      entitled: false,
      notes: [],
      loadError: 'Failed to load notes',
    });
  });

  it('recovers when the local sync after an entitled load throws', async () => {
    // Arrange
    const ports = makePorts({
      entitlement: { readSession: vi.fn(() => true) },
      local: {
        syncServerNotes: vi.fn(async () => {
          throw new Error('idb broken');
        }),
        listStoredNotes: vi.fn(async () => []),
      },
    });

    // Act
    const result: VaultLoadResult = await loadVault({
      userId: 'user-1',
      ports,
    });

    // Assert
    expect(result.kind).toBe('recovered');
  });
});
