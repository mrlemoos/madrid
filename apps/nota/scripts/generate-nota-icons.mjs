// Regenerates brand SVG sources + derived rasters from the Madrid M mark.
//
// Usage (repo root): `pnpm run generate:nota-icons`
//
// Sources (written from `src/lib/madrid-mark.mjs`):
// - `../nota-electron/buildResources/icon-light.svg` (dock / .icns / apple-touch)
// - `../nota-electron/buildResources/icon-dark.svg` (same mark; dock follows nativeTheme)
// - `public/favicon.svg` (light+dark via prefers-color-scheme; synced to marketing)
// - `public/madrid-logo.svg` (full-width lockup; synced to marketing)
//
// Outputs:
// - `../nota-electron/buildResources/icon.png` (light dock / .icns source)
// - `../nota-electron/buildResources/icon.icns` (macOS bundle icon)
// - `../nota-electron/buildResources/icon-dark.png` (1024; Electron dock via nativeTheme)
// - `public/apple-touch-icon.png` (180×180 from light SVG)
// - `../nota-marketing/public/favicon.svg` (copy of app favicon)
// - `../nota-marketing/public/apple-touch-icon.png` (copy)
// - `../nota-marketing/public/favicon.ico` (16+32 from light SVG)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  DOCK_ICON_MAX_CONTENT_FILL_RATIO,
  measureDockIconPng,
} from './dock-icon-metrics.mjs';
import {
  renderFaviconSvg,
  renderIconDarkSvg,
  renderIconLightSvg,
} from '../src/lib/madrid-mark.mjs';
import { renderWordmarkSvg } from '../src/lib/madrid-wordmark.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTA_APP_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(NOTA_APP_ROOT, 'public');
const ELECTRON_BUILD_RESOURCES = path.resolve(
  NOTA_APP_ROOT,
  '..',
  'nota-electron',
  'buildResources',
);

const ICON_PNG_PATH = path.join(ELECTRON_BUILD_RESOURCES, 'icon.png');
const ICON_LIGHT_SVG_PATH = path.join(
  ELECTRON_BUILD_RESOURCES,
  'icon-light.svg',
);
const ICON_DARK_SVG_PATH = path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.svg');
const ICON_DARK_PNG_PATH = path.join(ELECTRON_BUILD_RESOURCES, 'icon-dark.png');
const APPLE_TOUCH_ICON_PATH = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
const FAVICON_SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');
const WORDMARK_SVG_PATH = path.join(PUBLIC_DIR, 'madrid-logo.svg');
const ELECTRON_ICON_SIZE_PX = 1024;
/** macOS 26 Tahoe: ~12% transparent margin per side so opaque pixels avoid squircle jail. */
export const ELECTRON_ICON_VISIBLE_SCALE = DOCK_ICON_MAX_CONTENT_FILL_RATIO;

const ICNS_PNG_CHUNKS = [
  ['ic04', 16],
  ['ic11', 32],
  ['ic05', 32],
  ['ic12', 64],
  ['ic07', 128],
  ['ic13', 256],
  ['ic08', 256],
  ['ic14', 512],
  ['ic09', 512],
  ['ic10', 1024],
];

async function renderPaddedIconPng(inputPath, outputPath, label) {
  if (!fs.existsSync(inputPath)) {
    console.warn(`Skipping ${label} (missing ${inputPath})`);
    return;
  }

  const innerSize = Math.round(
    ELECTRON_ICON_SIZE_PX * ELECTRON_ICON_VISIBLE_SCALE,
  );
  const inset = Math.floor((ELECTRON_ICON_SIZE_PX - innerSize) / 2);
  const icon = await sharp(inputPath, { density: 288 })
    .resize(innerSize, innerSize, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: ELECTRON_ICON_SIZE_PX,
      height: ELECTRON_ICON_SIZE_PX,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, left: inset, top: inset }])
    .png()
    .toFile(outputPath);

  console.log('Wrote', outputPath);
}

function writeSvgSources() {
  fs.writeFileSync(ICON_LIGHT_SVG_PATH, renderIconLightSvg());
  fs.writeFileSync(ICON_DARK_SVG_PATH, renderIconDarkSvg());
  fs.writeFileSync(FAVICON_SVG_PATH, renderFaviconSvg());
  fs.writeFileSync(WORDMARK_SVG_PATH, renderWordmarkSvg());
  console.log('Wrote', ICON_LIGHT_SVG_PATH);
  console.log('Wrote', ICON_DARK_SVG_PATH);
  console.log('Wrote', FAVICON_SVG_PATH);
  console.log('Wrote', WORDMARK_SVG_PATH);
}

async function writeIconPng() {
  await renderPaddedIconPng(ICON_LIGHT_SVG_PATH, ICON_PNG_PATH, 'icon.png');
}

async function assertDockIconSafeZone(pngPath, label) {
  const { outerBandOpaqueCount, contentFillRatio } =
    await measureDockIconPng(pngPath);
  if (outerBandOpaqueCount > 0) {
    throw new Error(
      `${label}: ${outerBandOpaqueCount} opaque pixels in outer Tahoe margin band`,
    );
  }
  if (contentFillRatio > DOCK_ICON_MAX_CONTENT_FILL_RATIO + 0.005) {
    throw new Error(
      `${label}: content fill ${(contentFillRatio * 100).toFixed(1)}% exceeds Tahoe safe zone`,
    );
  }
}

async function writeIconDarkPng() {
  await renderPaddedIconPng(
    ICON_DARK_SVG_PATH,
    ICON_DARK_PNG_PATH,
    'icon-dark.png',
  );
}

async function writeIcns() {
  const chunks = await Promise.all(
    ICNS_PNG_CHUNKS.map(async ([type, size]) => {
      const png = await sharp(ICON_PNG_PATH)
        .resize(size, size)
        .png()
        .toBuffer();
      const chunk = Buffer.alloc(8 + png.length);
      chunk.write(type, 0, 4, 'ascii');
      chunk.writeUInt32BE(chunk.length, 4);
      png.copy(chunk, 8);
      return chunk;
    }),
  );
  const length = 8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(length, 4);
  const icnsOut = path.join(ELECTRON_BUILD_RESOURCES, 'icon.icns');
  fs.writeFileSync(icnsOut, Buffer.concat([header, ...chunks]));
  console.log('Wrote', icnsOut);
}

async function writeAppleTouchIcon() {
  await sharp(ICON_LIGHT_SVG_PATH, { density: 288 })
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(APPLE_TOUCH_ICON_PATH);
  console.log('Wrote', APPLE_TOUCH_ICON_PATH);
}

async function syncMarketingAssets() {
  const marketingFavicons = path.resolve(
    NOTA_APP_ROOT,
    '..',
    'nota-marketing',
    'scripts',
    'generate-favicons.mjs',
  );
  execFileSync(process.execPath, [marketingFavicons], { stdio: 'inherit' });
  console.log('Synced marketing favicons via generate-favicons.mjs');
}

writeSvgSources();
await writeIconPng();
await writeIconDarkPng();
await assertDockIconSafeZone(ICON_PNG_PATH, 'icon.png');
await assertDockIconSafeZone(ICON_DARK_PNG_PATH, 'icon-dark.png');
await writeAppleTouchIcon();
await syncMarketingAssets();
await writeIcns();
