import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTA_PUBLIC = path.resolve(__dirname, '..', 'public');
const ELECTRON_BUILD_RESOURCES = path.resolve(
  __dirname,
  '..',
  '..',
  'nota-electron',
  'buildResources',
);
const MARKETING_PUBLIC = path.resolve(
  __dirname,
  '..',
  '..',
  'nota-marketing',
  'public',
);

/** Liquid-glass note stack must use layered sheet ids, not the retired pen/leaf mark. */
const GLASS_SHEET_IDS = ['glassBase', 'sheetBack', 'sheetMid', 'sheetFront'];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Nota liquid-glass brand icons', () => {
  it('icon-light.svg layers a glass note stack', () => {
    // Arrange
    const svg = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg'));

    // Act / Assert
    for (const id of GLASS_SHEET_IDS) {
      expect(svg).toContain(`id="${id}"`);
    }
    expect(svg).not.toMatch(/pen nib/i);
  });

  it('icon-dark.svg mirrors the same glass note stack', () => {
    // Arrange
    const svg = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg'));

    // Act / Assert
    for (const id of GLASS_SHEET_IDS) {
      expect(svg).toContain(`id="${id}"`);
    }
    expect(svg).not.toMatch(/pen nib/i);
  });

  it('favicon.svg switches light/dark glass fills via prefers-color-scheme', () => {
    // Arrange
    const svg = read(path.join(NOTA_PUBLIC, 'favicon.svg'));

    // Act / Assert
    expect(svg).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
    for (const id of GLASS_SHEET_IDS) {
      expect(svg).toContain(`id="${id}"`);
    }
    expect(svg).not.toMatch(/pen nib/i);
  });

  it('marketing favicon.svg matches the app glass mark', () => {
    // Arrange
    const app = read(path.join(NOTA_PUBLIC, 'favicon.svg'));
    const marketing = read(path.join(MARKETING_PUBLIC, 'favicon.svg'));

    // Act / Assert
    expect(marketing).toBe(app);
  });
});
