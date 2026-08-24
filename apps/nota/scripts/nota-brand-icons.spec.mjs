import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  NOTA_N_PATH,
  NOTA_N_SERIF_THICKNESS,
  NOTA_N_STEM_WIDTH,
  NOTA_N_VIEWBOX,
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
const RETIRED_PLATE_GREYS = ['#D4CFC6', '#2E2C29'];
const PLATE_RADIUS = 114;
const PLATE_BLACK = '#000000';
const PLATE_SHADE_TOP = '#241C14';
const INK_PAPER = '#E8DCC8';
const BONE_IVORY = '#F2EDE4';
const COLD_SHADE = '#1A1A1A';
/** Fat Didot N must occupy the plate, not a skinny mid-glyph. */
const MIN_N_FILL_RATIO = 0.62;
/** Hairline serifs: thickness must stay well below stem width. */
const MAX_SERIF_TO_STEM = 0.16;

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function pathAabb(d) {
  const nums = [...d.matchAll(/-?\d*\.?\d+/g)].map(Number);
  const xs = [];
  const ys = [];
  for (let i = 0; i < nums.length; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function nMarkup(svg) {
  return svg.match(/<path id="notaN"[^>]*>/)?.[0] ?? '';
}

function assertEngravedBlackPlate(svg) {
  expect(svg).toContain('id="notaPlate"');
  expect(svg).toContain('id="notaN"');
  expect(svg.match(/id="notaPlate"[^>]*\brx="([\d.]+)"/)?.[1]).toBe(
    String(PLATE_RADIUS),
  );
  expect(svg).toContain('linearGradient');
  expect(svg).toContain(PLATE_BLACK);
  expect(svg).toContain(PLATE_SHADE_TOP);
  expect(svg).toContain(INK_PAPER);
  expect(svg).not.toContain(BONE_IVORY);
  expect(svg).not.toContain(COLD_SHADE);
  expect(svg).toContain('id="notaNClip"');
  expect(svg).toContain('id="notaNShadow"');
  expect(svg).toContain('id="notaNHighlight"');
  for (const grey of RETIRED_PLATE_GREYS) {
    expect(svg).not.toContain(grey);
  }
  expect(RETIRED_GLASS_IDS.filter((id) => svg.includes(`id="${id}"`))).toEqual(
    [],
  );
  expect(nMarkup(svg)).toMatch(/\bfill="/);
  expect(nMarkup(svg)).not.toMatch(/stroke-linecap="round"/);
}

describe('Nota Didot N brand icons', () => {
  it('Didot N fills the plate instead of floating as a thin glyph', () => {
    // Arrange
    const viewBox = NOTA_N_VIEWBOX;

    // Act
    const { width, height } = pathAabb(NOTA_N_PATH);

    // Assert
    expect(width / viewBox).toBeGreaterThanOrEqual(MIN_N_FILL_RATIO);
    expect(height / viewBox).toBeGreaterThanOrEqual(MIN_N_FILL_RATIO);
  });

  it('light and dark dock marks are the same black Apple-shaded plate', () => {
    // Arrange
    const light = renderIconLightSvg();

    // Act
    const dark = renderIconDarkSvg();

    // Assert
    expect(dark).toBe(light);
    assertEngravedBlackPlate(light);
  });

  it('favicon stays on the black plate in every colour scheme', () => {
    // Arrange
    const svg = renderFaviconSvg();

    // Act
    const switchesPlateInDark =
      /@media\s*\(prefers-color-scheme:\s*dark\)/.test(svg);

    // Assert
    expect(switchesPlateInDark).toBe(false);
    assertEngravedBlackPlate(svg);
    expect(svg).not.toMatch(/pen nib/i);
  });

  it('Didot serifs stay hairline against fat stems', () => {
    // Arrange
    const stem = NOTA_N_STEM_WIDTH;
    const serif = NOTA_N_SERIF_THICKNESS;

    // Act
    const ratio = serif / stem;

    // Assert
    expect(stem).toBeGreaterThanOrEqual(88);
    expect(serif).toBeLessThanOrEqual(14);
    expect(ratio).toBeLessThanOrEqual(MAX_SERIF_TO_STEM);
  });

  it('icon-light.svg is a black Apple-shaded plate with an engraved paper N', () => {
    // Arrange
    const svg = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg'));

    // Act
    const hasPlate = svg.includes('id="notaPlate"');

    // Assert
    expect(hasPlate).toBe(true);
    assertEngravedBlackPlate(svg);
  });

  it('icon-dark.svg matches icon-light.svg', () => {
    // Arrange
    const light = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg'));
    const dark = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg'));

    // Act
    const same = dark === light;

    // Assert
    expect(same).toBe(true);
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
