import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DOCK_ICON_MAX_CONTENT_FILL_RATIO,
  measureDockIconPng,
} from './dock-icon-metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ELECTRON_BUILD_RESOURCES = path.resolve(
  __dirname,
  '..',
  '..',
  'nota-electron',
  'buildResources',
);

describe('macOS dock icon assets', () => {
  for (const name of ['icon.png', 'icon-dark.png']) {
    it(`${name} keeps opaque pixels inside the Tahoe safe zone`, async () => {
      // Arrange
      const pngPath = path.join(ELECTRON_BUILD_RESOURCES, name);

      // Act
      const { outerBandOpaqueCount, contentFillRatio, aabbCornerOpaque } =
        await measureDockIconPng(pngPath);

      // Assert
      expect(outerBandOpaqueCount).toBe(0);
      expect(aabbCornerOpaque).toBe(false);
      expect(contentFillRatio).toBeLessThanOrEqual(
        DOCK_ICON_MAX_CONTENT_FILL_RATIO + 0.005,
      );
    });
  }
});
