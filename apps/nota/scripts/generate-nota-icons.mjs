// Regenerates derived brand assets from liquid-glass SVG sources.
//
// Usage (repo root): `pnpm run generate:nota-icons`
//
// Inputs:
// - `../nota-electron/buildResources/icon-light.svg` (light dock / .icns / apple-touch)
// - `../nota-electron/buildResources/icon-dark.svg` (dark dock raster)
// - `public/favicon.svg` (hand-authored light+dark; synced to marketing)
//
// Outputs:
// - `../nota-electron/buildResources/icon.png` (light dock / .icns source)
// - `../nota-electron/buildResources/icon.icns` (macOS only, via iconutil)
// - `../nota-electron/buildResources/icon-dark.png` (1024; Electron dock via nativeTheme)
// - `public/apple-touch-icon.png` (180×180 from light SVG)
// - `../nota-marketing/public/favicon.svg` (copy of app favicon)
// - `../nota-marketing/public/apple-touch-icon.png` (copy)
// - `../nota-marketing/public/favicon.ico` (16+32 from light SVG)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  DOCK_ICON_MAX_CONTENT_FILL_RATIO,
  measureDockIconPng,
} from './dock-icon-metrics.mjs';

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
const ELECTRON_ICON_SIZE_PX = 1024;
/** macOS 26 Tahoe: ~12% transparent margin per side so opaque pixels avoid squircle jail. */
export const ELECTRON_ICON_VISIBLE_SCALE = DOCK_ICON_MAX_CONTENT_FILL_RATIO;

const ICONSET_SIZES = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
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
  if (process.platform !== 'darwin') {
    console.warn(
      'Skipping icon.icns (iconutil requires macOS). Run this script on a Mac to refresh Electron icons.',
    );
    return;
  }

  const iconsetDir = path.join(
    os.tmpdir(),
    `nota-brand-${Date.now()}-${process.pid}.iconset`,
  );
  fs.mkdirSync(iconsetDir, { recursive: true });

  try {
    for (const [filename, size] of ICONSET_SIZES) {
      const outPath = path.join(iconsetDir, filename);
      await sharp(ICON_PNG_PATH).resize(size, size).png().toFile(outPath);
    }

    const icnsOut = path.join(ELECTRON_BUILD_RESOURCES, 'icon.icns');
    execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsOut], {
      stdio: 'inherit',
    });
    console.log('Wrote', icnsOut);
  } finally {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  }
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

await writeIconPng();
await writeIconDarkPng();
await assertDockIconSafeZone(ICON_PNG_PATH, 'icon.png');
await assertDockIconSafeZone(ICON_DARK_PNG_PATH, 'icon-dark.png');
await writeIcns();
await writeAppleTouchIcon();
await syncMarketingAssets();
