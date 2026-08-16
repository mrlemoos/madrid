import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  renderFaviconSvg,
  renderIconDarkSvg,
  renderIconLightSvg,
} from '../src/lib/nota-n-mark.mjs';

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

const RETIRED_GLASS_IDS = ['glassBase', 'sheetBack', 'sheetMid', 'sheetFront'];
const PLATE_RADIUS = 114;

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function strokeWidths(svg) {
  return [...svg.matchAll(/stroke-width="([\d.]+)"/g)].map((match) =>
    Number(match[1]),
  );
}

describe('Nota geometric N brand icons', () => {
  it('icon-light.svg is a flat stone plate with a geometric N', () => {
    // Arrange
    const svg = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg'));

    // Act
    const hasPlate = svg.includes('id="notaPlate"');
    const hasN = svg.includes('id="notaN"');
    const plateRadius = svg.match(/id="notaPlate"[^>]*\brx="([\d.]+)"/)?.[1];
    const hasGlassGradient = svg.includes('linearGradient');
    const retiredIds = RETIRED_GLASS_IDS.filter((id) =>
      svg.includes(`id="${id}"`),
    );
    const nMarkup = svg.match(/<path id="notaN"[^>]*>/)?.[0] ?? '';

    // Assert
    expect(hasPlate).toBe(true);
    expect(hasN).toBe(true);
    expect(plateRadius).toBe(String(PLATE_RADIUS));
    expect(hasGlassGradient).toBe(false);
    expect(retiredIds).toEqual([]);
    expect(svg).toContain('#D4CFC6');
    expect(svg).toContain('#1F1D1A');
    expect(svg).toMatch(/<path\b/);
    expect(nMarkup).toMatch(/\bfill="/);
    expect(nMarkup).not.toMatch(/stroke-linecap="round"/);
    expect(strokeWidths(svg)).toEqual([]);
  });

  it('icon-dark.svg mirrors the N on a charcoal plate', () => {
    // Arrange
    const svg = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg'));

    // Act
    const hasPlate = svg.includes('id="notaPlate"');
    const hasN = svg.includes('id="notaN"');
    const plateRadius = svg.match(/id="notaPlate"[^>]*\brx="([\d.]+)"/)?.[1];
    const retiredIds = RETIRED_GLASS_IDS.filter((id) =>
      svg.includes(`id="${id}"`),
    );

    // Assert
    expect(hasPlate).toBe(true);
    expect(hasN).toBe(true);
    expect(plateRadius).toBe(String(PLATE_RADIUS));
    expect(retiredIds).toEqual([]);
    expect(svg).toContain('#2E2C29');
    expect(svg).toContain('#F2EDE4');
    expect(svg).not.toMatch(/linearGradient/);
  });

  it('favicon.svg switches stone/charcoal plates via prefers-color-scheme', () => {
    // Arrange
    const svg = read(path.join(NOTA_PUBLIC, 'favicon.svg'));

    // Act
    const hasColorScheme = /@media\s*\(prefers-color-scheme:\s*dark\)/.test(
      svg,
    );
    const retiredIds = RETIRED_GLASS_IDS.filter((id) =>
      svg.includes(`id="${id}"`),
    );

    // Assert
    expect(hasColorScheme).toBe(true);
    expect(svg).toContain('id="notaPlate"');
    expect(svg).toContain('id="notaN"');
    expect(retiredIds).toEqual([]);
    expect(svg).not.toMatch(/pen nib/i);
  });

  it('marketing favicon.svg matches the app mark', () => {
    // Arrange
    const appPath = path.join(NOTA_PUBLIC, 'favicon.svg');
    const marketingPath = path.join(MARKETING_PUBLIC, 'favicon.svg');

    // Act
    const app = read(appPath);
    const marketing = read(marketingPath);

    // Assert
    expect(marketing).toBe(app);
  });

  it('committed SVGs match the mark renderer', () => {
    // Arrange
    const lightPath = path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg');
    const darkPath = path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg');
    const faviconPath = path.join(NOTA_PUBLIC, 'favicon.svg');

    // Act
    const light = read(lightPath);
    const dark = read(darkPath);
    const favicon = read(faviconPath);
    const renderedLight = renderIconLightSvg();
    const renderedDark = renderIconDarkSvg();
    const renderedFavicon = renderFaviconSvg();

    // Assert
    expect(light).toBe(renderedLight);
    expect(dark).toBe(renderedDark);
    expect(favicon).toBe(renderedFavicon);
  });
});
