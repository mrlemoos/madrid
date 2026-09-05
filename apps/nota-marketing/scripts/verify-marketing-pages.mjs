/**
 * Post-build guard for every marketing page.
 *
 * Checks what earns traffic and clicks rather than one page's markup: search
 * metadata, share cards, a single heading outline, and Safari chrome tinting.
 * Run from `apps/nota-marketing` after `astro build`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');

const SITE_ORIGIN = 'https://getmadrid.app';
const THEME_COLOR_META_ID = 'mkt-theme-color';

/** Every `index.html` under `dist`, as site-root paths (`/`, `/pricing`, …). */
function findPages(dir) {
  const pages = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      pages.push(...findPages(entryPath));
    } else if (entry.name.endsWith('.html')) {
      pages.push(entryPath);
    }
  }
  return pages;
}

function routeFor(htmlPath) {
  const rel = relative(distDir, htmlPath).split(sep).join('/');
  return `/${rel.replace(/index\.html$/, '').replace(/\.html$/, '')}`;
}

const failures = [];

function check(route, condition, message) {
  if (!condition) {
    failures.push(`${route}: ${message}`);
  }
}

const pages = findPages(distDir);
if (pages.length === 0) {
  console.error(
    'verify-marketing-pages: no HTML in dist; run astro build first',
  );
  process.exit(1);
}

for (const htmlPath of pages) {
  const route = routeFor(htmlPath);
  const { document } = new JSDOM(readFileSync(htmlPath, 'utf8')).window;

  const title = document.querySelector('title')?.textContent?.trim() ?? '';
  check(route, title.length > 0, 'missing <title>');

  const description = document
    .querySelector('meta[name="description"]')
    ?.getAttribute('content')
    ?.trim();
  check(route, Boolean(description), 'missing meta description');

  const canonical = document
    .querySelector('link[rel="canonical"]')
    ?.getAttribute('href');
  check(route, Boolean(canonical), 'missing canonical link');
  check(
    route,
    !canonical || canonical.startsWith(SITE_ORIGIN),
    `canonical is not absolute on ${SITE_ORIGIN}: ${canonical}`,
  );

  const ogImage = document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute('content');
  check(route, Boolean(ogImage), 'missing og:image');
  check(
    route,
    !ogImage || ogImage.startsWith(SITE_ORIGIN),
    `og:image is not absolute on ${SITE_ORIGIN}: ${ogImage}`,
  );

  const headings = document.querySelectorAll('h1');
  check(
    route,
    headings.length === 1,
    `expected 1 <h1>, found ${headings.length}`,
  );

  // Safari 26 samples the unmediated theme-color meta and the body hex.
  const themeColor = document.getElementById(THEME_COLOR_META_ID);
  check(
    route,
    Boolean(themeColor),
    `missing theme-color meta #${THEME_COLOR_META_ID}`,
  );
  check(
    route,
    document.querySelectorAll('meta[name="theme-color"][media]').length === 0,
    'mediated theme-color meta survived into the build',
  );

  const chromeClass = document.documentElement.className;
  check(
    route,
    chromeClass.includes('light') || chromeClass.includes('dark'),
    `<html> is missing a chrome scheme class, found "${chromeClass}"`,
  );

  for (const node of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      JSON.parse(node.textContent ?? '');
    } catch (error) {
      check(route, false, `invalid JSON-LD: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`verify-marketing-pages: ${failures.length} problem(s)`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(`verify-marketing-pages: ok (${pages.length} pages)`);
