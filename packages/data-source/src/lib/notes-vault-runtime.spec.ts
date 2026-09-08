import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  OutboxDrainer,
  RemoteNoteSync,
  VaultConnectivity,
} from '@getmadrid/notes-offline-core';

const createOutboxDrainer = vi.fn(() => ({ drain: vi.fn() }));
const createVaultMutator = vi.fn(() => ({ mutator: true }));
const createNoteOnServer = vi.fn();
const updateNoteOnServer = vi.fn();
const deleteNoteOnServer = vi.fn();
const getClerkAccessToken = vi.fn();
const browserClient = { client: 'browser' };

vi.mock('@getmadrid/notes-offline-core', () => ({
  createOutboxDrainer,
  createVaultMutator,
}));
vi.mock('@getmadrid/notes-offline', () => ({
  createLocalOnlyNote: vi.fn(),
  getStoredNote: vi.fn(),
  listOutbox: vi.fn(),
  markNoteSyncedFromServer: vi.fn(),
  markPendingDelete: vi.fn(),
  removeOutboxEntry: vi.fn(),
  removeStoredNote: vi.fn(),
  saveLocalNoteDraft: vi.fn(),
}));
vi.mock('../models/notes', () => ({
  createNote: createNoteOnServer,
  updateNote: updateNoteOnServer,
  deleteNote: deleteNoteOnServer,
}));
vi.mock('./clerk-token-ref', () => ({ getClerkAccessToken }));
vi.mock('./supabase/browser', () => ({
  getBrowserClient: () => browserClient,
}));

const { drainNotesOutbox, isLikelyOnline, vaultMutator } = await import(
  './notes-vault-runtime'
);

/** The deps object handed to `createVaultMutator` at module load. */
function deps(): {
  remote: RemoteNoteSync;
  connectivity: VaultConnectivity;
  drainer: OutboxDrainer;
} {
  return createVaultMutator.mock.calls[0]?.[0] as never;
}

beforeEach(() => {
  createNoteOnServer.mockReset().mockResolvedValue({ id: 'note-1' });
  updateNoteOnServer.mockReset().mockResolvedValue({ id: 'note-1' });
  deleteNoteOnServer.mockReset().mockResolvedValue(undefined);
  getClerkAccessToken.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isLikelyOnline', () => {
  it('follows the browser when it reports being offline', () => {
    // Arrange
    vi.stubGlobal('navigator', { onLine: false });

    // Act|Assert
    expect(isLikelyOnline()).toBe(false);
  });

  it('assumes online where there is no navigator at all', () => {
    // Arrange
    vi.stubGlobal('navigator', undefined);

    // Act|Assert — server render must not decide the vault is offline
    expect(isLikelyOnline()).toBe(true);
  });
});

describe('vault connectivity', () => {
  it('refuses to sync while the browser is offline, without asking Clerk', async () => {
    // Arrange
    vi.stubGlobal('navigator', { onLine: false });

    // Act
    const canSync = await deps().connectivity.canSync();

    // Assert
    expect(canSync).toBe(false);
    expect(getClerkAccessToken).not.toHaveBeenCalled();
  });

  it('refuses to sync online but signed out', async () => {
    // Arrange
    vi.stubGlobal('navigator', { onLine: true });
    getClerkAccessToken.mockResolvedValue(null);

    // Act|Assert
    await expect(deps().connectivity.canSync()).resolves.toBe(false);
  });

  it('syncs when online with a session', async () => {
    // Arrange
    vi.stubGlobal('navigator', { onLine: true });
    getClerkAccessToken.mockResolvedValue('jwt-123');

    // Act|Assert
    await expect(deps().connectivity.canSync()).resolves.toBe(true);
  });
});

describe('remote note sync', () => {
  it('replays an outbox create with the id the client already assigned', async () => {
    // Arrange
    const input = {
      id: 'note-local',
      title: 'Draft',
      content: { type: 'doc' },
      due_at: null,
      is_deadline: false,
      editor_settings: {},
      folder_id: 'folder-1',
    };

    // Act
    await deps().remote.createNote('user-1', input);

    // Assert
    expect(createNoteOnServer).toHaveBeenCalledWith(
      browserClient,
      'user-1',
      'Draft',
      { type: 'doc' },
      { id: 'note-local', editor_settings: {}, folder_id: 'folder-1' },
    );
  });

  it('lets the server assign the id on an eager create', async () => {
    // Arrange|Act
    await deps().remote.createNoteEager('user-1', {
      title: 'Draft',
      folder_id: null,
    });

    // Assert
    expect(createNoteOnServer).toHaveBeenCalledWith(
      browserClient,
      'user-1',
      'Draft',
      undefined,
      { folder_id: null },
    );
  });

  it('forwards only the patchable note fields on update', async () => {
    // Arrange|Act
    await deps().remote.updateNote('note-1', { title: 'Renamed' });

    // Assert
    expect(updateNoteOnServer).toHaveBeenCalledWith(browserClient, 'note-1', {
      title: 'Renamed',
      content: undefined,
      due_at: undefined,
      is_deadline: undefined,
      editor_settings: undefined,
      folder_id: undefined,
    });
  });

  it('deletes through the notes model', async () => {
    // Arrange|Act
    await deps().remote.deleteNote('note-1');

    // Assert
    expect(deleteNoteOnServer).toHaveBeenCalledWith(browserClient, 'note-1');
  });
});

describe('drainNotesOutbox', () => {
  it('drains through the same drainer the mutator was built with', async () => {
    // Arrange
    const drainer = createOutboxDrainer.mock.results[0]?.value as {
      drain: ReturnType<typeof vi.fn>;
    };
    drainer.drain.mockResolvedValue(true);

    // Act
    const drained = await drainNotesOutbox('user-1');

    // Assert
    expect(drainer.drain).toHaveBeenCalledWith('user-1');
    expect(deps().drainer).toBe(drainer);
    expect(drained).toBe(true);
  });
});

describe('vaultMutator', () => {
  it('is the mutator built over the local store, remote and connectivity', () => {
    // Arrange|Act|Assert
    expect(vaultMutator).toBe(createVaultMutator.mock.results[0]?.value);
    expect(createVaultMutator).toHaveBeenCalledTimes(1);
  });
});
