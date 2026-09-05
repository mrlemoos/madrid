/**
 * Writes marketing `favicon.ico` + `apple-touch-icon.png` from the Didot M
 * light SVG (same source as Electron dock / app favicon).
 *
 * Prefer `pnpm run generate:nota-icons` from the monorepo root (covers Electron
 * + app + marketing). This script remains for marketing-only regenerations.
 *
 * Run: node apps/nota-marketing/scripts/generate-favicons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(__dirname, '../public');
const iconLightSvg = path.resolve(
  __dirname,
  '../../nota-electron/buildResources/icon-light.svg',
);
const appFaviconSvg = path.resolve(__dirname, '../../nota/public/favicon.svg');
const appWordmarkSvg = path.resolve(
  __dirname,
  '../../nota/public/madrid-logo.svg',
);

async function main() {
  await fs.promises.mkdir(publicRoot, { recursive: true });

  await fs.promises.copyFile(
    appFaviconSvg,
    path.join(publicRoot, 'favicon.svg'),
  );
  await fs.promises.copyFile(
    appWordmarkSvg,
    path.join(publicRoot, 'madrid-logo.svg'),
  );

  const png16 = await sharp(iconLightSvg, { density: 288 })
    .resize(16, 16)
    .png()
    .toBuffer();
  const png32 = await sharp(iconLightSvg, { density: 288 })
    .resize(32, 32)
    .png()
    .toBuffer();
  const ico = await toIco([png16, png32]);
  await fs.promises.writeFile(path.join(publicRoot, 'favicon.ico'), ico);

  await sharp(iconLightSvg, { density: 288 })
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(publicRoot, 'apple-touch-icon.png'));

  console.log(
    'Wrote public/favicon.svg, favicon.ico, and apple-touch-icon.png',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
