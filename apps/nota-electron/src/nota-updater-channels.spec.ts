import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  NOTA_UPDATES_CHECK_CHANNEL,
  NOTA_UPDATES_QUIT_INSTALL_CHANNEL,
  NOTA_UPDATES_STATUS_CHANNEL,
} from './nota-updater-channels.js';

const CHANNELS = [
  NOTA_UPDATES_STATUS_CHANNEL,
  NOTA_UPDATES_CHECK_CHANNEL,
  NOTA_UPDATES_QUIT_INSTALL_CHANNEL,
];

describe('nota updater IPC channels', () => {
  it('namespaces every channel so it cannot collide with another feature', () => {
    // Arrange|Act|Assert
    expect(CHANNELS).toEqual([
      'nota-updates:status',
      'nota-updates:check',
      'nota-updates:quit-install',
    ]);
    expect(new Set(CHANNELS).size).toBe(CHANNELS.length);
  });

  it('matches the names inlined in the preload bridge', () => {
    // Arrange — the preload script cannot import from the main bundle
    const preload = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'preload.cts'),
      'utf8',
    );

    // Act|Assert — a drift here silently breaks Settings → Check for updates
    for (const channel of CHANNELS) {
      expect(preload).toContain(channel);
    }
  });
});
