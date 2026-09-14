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

async function screenshot(filename, { width, height }) {
  return sharp(path.join(assetsDir, filename))
    .resize(width, height, { fit: 'cover', position: 'top' })
    .composite([
      {
        input: svg`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="18" fill="#fff"/></svg>`,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

function backdrop() {
  return svg`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wash" cx="89%" cy="10%" r="78%"><stop stop-color="#ddc9ac" stop-opacity=".62"/><stop offset="1" stop-color="#f4ecdf" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#f4ecdf"/>
  <rect width="${W}" height="${H}" fill="url(#wash)"/>
  <rect x="28" y="28" width="1144" height="574" rx="30" fill="none" stroke="#17120d" stroke-opacity=".14"/>
  <path d="M62 492C205 428 329 539 476 476" fill="none" stroke="#8d7252" stroke-opacity=".2" stroke-width="2"/>
</svg>`;
}

async function logo() {
  return sharp(path.join(publicRoot, 'madrid-logo.svg'))
    .resize({ width: 228 })
    .png()
    .toBuffer();
}

function titleLines(lines) {
  return lines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : 72}">${text(line)}</tspan>`,
    )
    .join('');
}

async function writeCard({
  filename,
  eyebrow,
  title,
  description,
  image,
  price,
}) {
  const productImage = await screenshot(image, { width: 594, height: 458 });
  const copy = svg`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="72" y="196" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="600" letter-spacing="2.4" fill="#6f5137">${text(eyebrow.toUpperCase())}</text>
    <text x="72" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#17120d">${titleLines(title)}</text>
    <text x="72" y="470" font-family="ui-sans-serif, system-ui, sans-serif" font-size="25" fill="#514337">${text(description)}</text>
    ${price ? `<rect x="72" y="510" width="390" height="48" rx="24" fill="#17120d"/><text x="96" y="542" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f7efe2">${text(price)}</text>` : ''}
    <rect x="534" y="94" width="594" height="458" rx="18" fill="#17120d" fill-opacity=".16" transform="translate(10 12)"/>
    <rect x="534" y="94" width="594" height="458" rx="18" fill="#fff"/>
  </svg>`;
  const png = await sharp(backdrop())
    .composite([
      { input: copy },
      { input: await logo(), left: 72, top: 68 },
      { input: productImage, left: 534, top: 94 },
    ])
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(outDir, filename), png);
}

async function main() {
  await fs.promises.mkdir(outDir, { recursive: true });
  await writeCard({
    filename: 'home.png',
    eyebrow: 'Mac notes, without the noise',
    title: ['Think without', 'the feed.'],
    description: 'A Mac notes app that steps back.',
    image: 'note-writing.png',
  });
  await writeCard({
    filename: 'pricing.png',
    eyebrow: 'Madrid for Mac',
    title: ['One plan.', 'Whole app.'],
    description: 'Sync and backup included.',
    image: 'note-graph.png',
    price: `$${priceAnnualUsd}/year · $${priceMonthlyUsd}/month`,
  });
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
