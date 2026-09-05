import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  MADRID_ARCH_FLOURISH_PATH,
  MADRID_ARCH_PATH,
  MADRID_M_PATH,
  MADRID_M_SERIF_THICKNESS,
  MADRID_M_STEM_WIDTH,
  MADRID_MARK_VIEWBOX,
  renderFaviconSvg,
  renderIconDarkSvg,
  renderIconLightSvg,
} from '../src/lib/madrid-mark.mjs';
import { renderWordmarkSvg } from '../src/lib/madrid-wordmark.mjs';

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
const DARK_INK = '#17120D';
/** Fat Didot M must occupy the plate, not a skinny mid-glyph. */
const MIN_M_FILL_RATIO = 0.48;
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

function markMarkup(svg) {
  return svg.match(/<g id="madridMark"[^>]*>/)?.[0] ?? '';
}

function assertWroughtIronMadridMark(svg, { plate, ink }) {
  expect(svg).toContain('id="madridPlate"');
  expect(svg).toContain('id="madridM"');
  expect(svg).toContain('id="madridArch"');
  expect(svg).toContain('id="madridArchFlourish"');
  expect(svg.match(/id="madridPlate"[^>]*\brx="([\d.]+)"/)?.[1]).toBe(
    String(PLATE_RADIUS),
  );
  expect(svg).toContain('linearGradient');
  expect(svg).toContain(plate);
  expect(svg).toContain(ink);
  expect(svg).toContain('id="madridMarkClip"');
  expect(svg).toContain('id="madridMarkShadow"');
  expect(svg).toContain('id="madridMarkHighlight"');
  for (const grey of RETIRED_PLATE_GREYS) {
    expect(svg).not.toContain(grey);
  }
  expect(RETIRED_GLASS_IDS.filter((id) => svg.includes(`id="${id}"`))).toEqual(
    [],
  );
  expect(markMarkup(svg)).toMatch(/\bfill="/);
  expect(markMarkup(svg)).not.toMatch(/stroke-linecap="round"/);
}

describe('Madrid Didot M brand icons', () => {
  it('Didot M fills the plate instead of floating as a thin glyph', () => {
    // Arrange
    const viewBox = MADRID_MARK_VIEWBOX;

    // Act
    const { width, height } = pathAabb(MADRID_M_PATH);

    // Assert
    expect(width / viewBox).toBeGreaterThanOrEqual(MIN_M_FILL_RATIO);
    expect(height / viewBox).toBeGreaterThanOrEqual(MIN_M_FILL_RATIO);
  });

  it('places the M inside a shallow wrought-iron arch with one flourish', () => {
    // Arrange
    const light = renderIconLightSvg();

    // Act
    const hasArch = light.includes(MADRID_ARCH_PATH);
    const hasFlourish = light.includes(MADRID_ARCH_FLOURISH_PATH);

    // Assert
    expect(hasArch).toBe(true);
    expect(hasFlourish).toBe(true);
  });

  it('adapts the rounded plate for light and dark macOS appearance', () => {
    // Arrange
    const light = renderIconLightSvg();

    // Act
    const dark = renderIconDarkSvg();

    // Assert
    expect(dark).not.toBe(light);
    assertWroughtIronMadridMark(light, {
      plate: PLATE_BLACK,
      ink: INK_PAPER,
    });
    assertWroughtIronMadridMark(dark, {
      plate: INK_PAPER,
      ink: DARK_INK,
    });
  });

  it('favicon follows system appearance without changing its geometry', () => {
    // Arrange
    const svg = renderFaviconSvg();

    // Act
    const switchesPlateInDark =
      /@media\s*\(prefers-color-scheme:\s*dark\)/.test(svg);

    // Assert
    expect(switchesPlateInDark).toBe(true);
    expect(svg).toContain(MADRID_ARCH_PATH);
    expect(svg).toContain(MADRID_ARCH_FLOURISH_PATH);
  });

  it('writes the full icon-and-wordmark lockup as lower-case madrid', () => {
    // Arrange
    const wordmark = renderWordmarkSvg();

    // Act
    const label = wordmark.match(/aria-label="([^"]+)"/)?.[1];

    // Assert
    expect(label).toBe('madrid');
    expect(wordmark).toContain('id="madridWordmarkM"');
    expect(wordmark).toContain('href="#madridWordmarkM"');
    expect(wordmark).not.toContain('<text');
    expect(wordmark).toContain(MADRID_ARCH_PATH);
  });

  it('Didot serifs stay hairline against fat stems', () => {
    // Arrange
    const stem = MADRID_M_STEM_WIDTH;
    const serif = MADRID_M_SERIF_THICKNESS;

    // Act
    const ratio = serif / stem;

    // Assert
    expect(stem).toBeGreaterThanOrEqual(48);
    expect(serif).toBeLessThanOrEqual(14);
    expect(ratio).toBeLessThanOrEqual(MAX_SERIF_TO_STEM);
  });

  it('icon-light.svg matches the light renderer', () => {
    // Arrange
    const svg = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg'));

    // Act
    const rendered = renderIconLightSvg();

    // Assert
    expect(svg).toBe(rendered);
  });

  it('icon-dark.svg matches the dark renderer', () => {
    // Arrange
    const light = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-light.svg'));
    const dark = read(path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg'));

    // Act
    const rendered = renderIconDarkSvg();

    // Assert
    expect(dark).toBe(rendered);
    expect(dark).not.toBe(light);
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

  it('commits the full wordmark for app and marketing use', () => {
    // Arrange
    const appPath = path.join(NOTA_PUBLIC, 'madrid-logo.svg');
    const marketingPath = path.join(MARKETING_PUBLIC, 'madrid-logo.svg');

    // Act
    const app = read(appPath);
    const marketing = read(marketingPath);

    // Assert
    expect(app).toBe(renderWordmarkSvg());
    expect(marketing).toBe(app);
  });

  it('commits the Madrid ICNS bundle icon at every macOS size', async () => {
    // Arrange
    const icns = fs.readFileSync(
      path.join(ELECTRON_BUILD_RESOURCES, 'icon.icns'),
    );
    const chunks = [];
    for (let offset = 8; offset < icns.length; ) {
      const length = icns.readUInt32BE(offset + 4);
      chunks.push({
        type: icns.toString('ascii', offset, offset + 4),
        png: icns.subarray(offset + 8, offset + length),
      });
      offset += length;
    }

    // Act
    const largest = chunks.find(({ type }) => type === 'ic10');
    const metadata = await sharp(largest?.png).metadata();

    // Assert
    expect(icns.toString('ascii', 0, 4)).toBe('icns');
    expect(chunks.map(({ type }) => type)).toEqual([
      'ic04',
      'ic11',
      'ic05',
      'ic12',
      'ic07',
      'ic13',
      'ic08',
      'ic14',
      'ic09',
      'ic10',
    ]);
    expect(metadata).toMatchObject({ width: 1024, height: 1024 });
  });
});
