/**
 * Post-build guards for marketing: hero assets and Safari theme-color chrome.
 * Run from `apps/nota-marketing` after `astro build`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function readDistHtml(relativePath) {
  const htmlPath = join(root, 'dist', relativePath);
  try {
    return readFileSync(htmlPath, 'utf8');
  } catch {
    console.error(
      `verify-marketing-hero: missing dist/${relativePath}; run astro build first`,
    );
    process.exit(1);
  }
}

function assertIncludes(html, relativePath, needle, label) {
  if (!html.includes(needle)) {
    console.error(
      `verify-marketing-hero: expected ${label} (${needle}) in dist/${relativePath}`,
    );
    process.exit(1);
  }
}

function assertExcludes(html, relativePath, needle, label) {
  if (html.includes(needle)) {
    console.error(
      `verify-marketing-hero: unexpected ${label} (${needle}) in dist/${relativePath}`,
    );
    process.exit(1);
  }
}

const indexHtml = readDistHtml('index.html');

const heroChecks = [
  ['/_astro/desktop-app-screenshot.', 'hero screenshot asset'],
  ['data-nota-hero-screenshot', 'hero screenshot hook'],
  ['fetchpriority="high"', 'hero image fetch priority'],
  ['alt=', 'hero image alt text'],
  ['mkt-hero-fade mkt-hero-fade-delay-3', 'hero screenshot fade-in'],
  ['mkt-hero-fade mkt-hero-fade-delay-1', 'hero download fade-in'],
  ['mkt-hero-fade mkt-hero-fade-delay-2', 'hero pricing link fade-in'],
  ['data-nota-download-mac', 'download Mac button hook'],
  ['Download for Mac', 'download Mac button label'],
];

for (const [needle, label] of heroChecks) {
  assertIncludes(indexHtml, 'index.html', needle, label);
}

assertIncludes(
  indexHtml,
  'index.html',
  'id="mkt-theme-color"',
  'Safari theme-color meta id',
);
assertIncludes(indexHtml, 'index.html', '#0a0a0a', 'dark hero theme-color hex');
assertIncludes(
  indexHtml,
  'index.html',
  'body{background-color:#ffffff}',
  'marketing body hex background',
);
assertIncludes(
  indexHtml,
  'index.html',
  'mkt-safari-top-chrome',
  'Safari top chrome hex header class',
);
assertIncludes(
  indexHtml,
  'index.html',
  'class="dark"',
  'dark html chrome class',
);
assertExcludes(
  indexHtml,
  'index.html',
  'name="theme-color" media=',
  'mediated theme-color meta',
);

const pricingHtml = readDistHtml('pricing/index.html');
assertIncludes(
  pricingHtml,
  'pricing/index.html',
  '#ffffff',
  'light page theme-color hex',
);
assertIncludes(
  pricingHtml,
  'pricing/index.html',
  'body{background-color:#ffffff}',
  'light page body hex background',
);
assertIncludes(
  pricingHtml,
  'pricing/index.html',
  'class="light"',
  'light html chrome class',
);

console.log('verify-marketing-hero: ok');
