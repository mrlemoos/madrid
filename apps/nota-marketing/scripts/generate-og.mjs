/**
 * Regenerates static Open Graph PNGs in public/og/.
 * Run from monorepo root: pnpm --dir apps/nota-marketing run generate:og
 * Requires root dependency `sharp`.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'public/og');
const publicRoot = path.join(appRoot, 'public');
const assetsDir = path.join(appRoot, 'src/assets/marketing');

const W = 1200;
const H = 630;

/** Keep in sync with `src/pages/pricing.astro` guide amounts. */
const priceMonthlyUsd = '2.49';
const priceAnnualUsd = '19.49';

function svg(strings, ...values) {
  return Buffer.from(String.raw({ raw: strings }, ...values), 'utf8');
}

function text(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function roundedImage(filename, { width, height }) {
  return sharp(path.join(assetsDir, filename))
    .resize(width, height, { fit: 'cover', position: 'top' })
    .composite([
      {
        input: svg`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="24" fill="#fff"/></svg>`,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

function backdrop() {
  return svg`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="100%" cy="0%" r="78%"><stop stop-color="#5a4b3b" stop-opacity=".62"/><stop offset=".65" stop-color="#201a15" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" x1="0" x2="1"><stop stop-color="#17120d"/><stop offset=".62" stop-color="#17120d" stop-opacity=".95"/><stop offset="1" stop-color="#17120d" stop-opacity=".24"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#17120d"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <path d="M0 524C264 450 505 550 711 495c186-49 294-142 489-74v209H0Z" fill="#e8dcc8" fill-opacity=".08"/>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
</svg>`;
}

async function logo() {
  return sharp(path.join(publicRoot, 'madrid-logo-on-dark.svg'))
    .resize({ width: 202 })
    .png()
    .toBuffer();
}

async function writeCard({ filename, eyebrow, title, description, image }) {
  const productImage = await roundedImage(image, { width: 520, height: 468 });
  const copy = svg`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="72" y="184" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="#f7efe2">${text(title)}</text>
    <text x="72" y="246" font-family="ui-sans-serif, system-ui, sans-serif" font-size="25" fill="#d0c3b3">${text(description)}</text>
    <text x="72" y="502" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" letter-spacing="2.4" fill="#b9a991">${text(eyebrow.toUpperCase())}</text>
    <rect x="644" y="81" width="520" height="468" rx="24" fill="#000" fill-opacity=".3"/>
  </svg>`;
  const png = await sharp(backdrop())
    .composite([
      { input: copy },
      { input: await logo(), left: 72, top: 61 },
      { input: productImage, left: 644, top: 81 },
    ])
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(outDir, filename), png);
}

async function writePricing() {
  const card = svg`<svg width="500" height="398" xmlns="http://www.w3.org/2000/svg">
    <rect width="500" height="398" rx="28" fill="#f7efe2"/>
    <text x="42" y="64" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" letter-spacing="2.4" fill="#746858">ANNUAL</text>
    <text x="42" y="151" font-family="Georgia, 'Times New Roman', serif" font-size="66" fill="#17120d">$${priceAnnualUsd}</text>
    <text x="42" y="190" font-family="ui-sans-serif, system-ui, sans-serif" font-size="21" fill="#746858">per year, USD</text>
    <path d="M42 230H458" stroke="#cfc0ab"/>
    <text x="42" y="278" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" fill="#17120d">Full app, sync, and backup</text>
    <text x="42" y="326" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" fill="#746858">$${priceMonthlyUsd} monthly also available</text>
  </svg>`;
  const copy = svg`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="72" y="210" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#f7efe2">Madrid pricing</text>
    <text x="72" y="274" font-family="ui-sans-serif, system-ui, sans-serif" font-size="25" fill="#d0c3b3">Subscribe in Settings after install.</text>
  </svg>`;
  const png = await sharp(backdrop())
    .composite([
      { input: copy },
      { input: await logo(), left: 72, top: 61 },
      { input: card, left: 650, top: 116 },
    ])
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(outDir, 'pricing.png'), png);
}

async function main() {
  await fs.promises.mkdir(outDir, { recursive: true });
  await writeCard({
    filename: 'home.png',
    eyebrow: 'macOS notes app',
    title: 'Think without the feed.',
    description: 'A quiet place to write and link ideas.',
    image: 'note-writing.png',
  });
  await writePricing();
  await fs.promises.copyFile(
    path.join(outDir, 'home.png'),
    path.join(publicRoot, 'og-default.png'),
  );
  console.log(
    `Wrote ${path.join(outDir, 'home.png')}, pricing.png, and ${path.join(publicRoot, 'og-default.png')}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
