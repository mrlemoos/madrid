/** Madrid's engraved M: wrought iron on a quiet, rounded plate. */

export const MADRID_MARK_VIEWBOX = 512;
/** Electron `dock.setIcon` paints the PNG as-is, so the plate carries its radius. */
export const MADRID_MARK_PLATE_RADIUS = 114;

export const NOTA_PLATE_BLACK = '#000000';
export const NOTA_PLATE_SHADE_TOP = '#241C14';
export const NOTA_INK_PAPER = '#E8DCC8';
export const NOTA_INK_HIGHLIGHT = '#F7EFE2';
export const MADRID_DARK_INK = '#17120D';

export const MADRID_M_STEM_WIDTH = 58;
export const MADRID_M_SERIF_THICKNESS = 8;

const PLATE = MADRID_MARK_VIEWBOX;
const OUTER = 130;
const M_TOP = 144;
const M_BOTTOM = 410;
const SERIF_OVERHANG = 12;
const DIAG_THICKNESS = 32;

function buildDidotMPath() {
  const W = MADRID_M_STEM_WIDTH;
  const S = MADRID_M_SERIF_THICKNESS;
  const L = OUTER;
  const T = M_TOP;
  const R = PLATE - OUTER;
  const B = M_BOTTOM;
  const leftOuter = L + SERIF_OVERHANG;
  const leftInner = leftOuter + W;
  const rightOuter = R - SERIF_OVERHANG;
  const rightInner = rightOuter - W;
  const serifRight = leftInner + 32;
  const serifLeft = rightInner - 32;
  const stemTop = T + S;
  const stemBottom = B - S;
  const apexOuterY = T + 108;
  const apexInnerY = apexOuterY + DIAG_THICKNESS;

  return [
    `M${L} ${B}`,
    `L${L} ${stemBottom}`,
    `L${leftOuter} ${stemBottom}`,
    `L${leftOuter} ${stemTop}`,
    `L${L} ${stemTop}`,
    `L${L} ${T}`,
    `L${serifRight} ${T}`,
    `L${serifRight} ${stemTop}`,
    `L${leftInner} ${stemTop}`,
    `L${PLATE / 2} ${apexOuterY}`,
    `L${rightInner} ${stemTop}`,
    `L${serifLeft} ${stemTop}`,
    `L${serifLeft} ${T}`,
    `L${R} ${T}`,
    `L${R} ${stemTop}`,
    `L${rightOuter} ${stemTop}`,
    `L${rightOuter} ${stemBottom}`,
    `L${R} ${stemBottom}`,
    `L${R} ${B}`,
    `L${serifLeft} ${B}`,
    `L${serifLeft} ${stemBottom}`,
    `L${rightInner} ${stemTop + 45}`,
    `L${PLATE / 2 + DIAG_THICKNESS / 2} ${apexInnerY}`,
    `L${PLATE / 2 - DIAG_THICKNESS / 2} ${apexInnerY}`,
    `L${leftInner} ${stemTop + 45}`,
    `L${leftInner} ${stemBottom}`,
    `L${serifRight} ${stemBottom}`,
    `L${serifRight} ${B}`,
    'Z',
  ].join(' ');
}

export const MADRID_M_PATH = buildDidotMPath();

/** Single shallow arch, modelled on Madrid balcony ironwork. */
export const MADRID_ARCH_PATH = [
  'M88 318',
  'L88 224',
  'C88 124 158 72 256 72',
  'C354 72 424 124 424 224',
  'L424 318',
  'L400 318',
  'L400 226',
  'C400 144 340 100 256 100',
  'C172 100 112 144 112 226',
  'L112 318',
  'Z',
].join(' ');

/** One small clasp at the arch apex, never a literal crown. */
export const MADRID_ARCH_FLOURISH_PATH = [
  'M256 58',
  'C246 68 246 80 256 90',
  'C266 80 266 68 256 58',
  'Z',
].join(' ');

/** Cropped to the monogram and arch with optical padding. */
export const MADRID_MARK_LOGO_VIEWBOX = '62 42 388 408';

export function plateShadeDefs(id, top, base, sheen) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/>
    <stop offset="0.38" stop-color="${base}"/>
    <stop offset="1" stop-color="${base}"/>
  </linearGradient>
  <linearGradient id="${id}Sheen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${sheen}" stop-opacity="0.16"/>
    <stop offset="0.2" stop-color="${sheen}" stop-opacity="0"/>
  </linearGradient>`;
}

export function markClip() {
  return `<clipPath id="madridMarkClip">
    <path id="madridM" d="${MADRID_M_PATH}"/>
    <path id="madridArch" d="${MADRID_ARCH_PATH}"/>
    <path id="madridArchFlourish" d="${MADRID_ARCH_FLOURISH_PATH}"/>
  </clipPath>`;
}

export function plateRects(gradientId, plateId = 'madridPlate') {
  return `<rect id="${plateId}" width="${MADRID_MARK_VIEWBOX}" height="${MADRID_MARK_VIEWBOX}" rx="${MADRID_MARK_PLATE_RADIUS}" fill="url(#${gradientId})"/>
  <rect id="${plateId}Sheen" width="${MADRID_MARK_VIEWBOX}" height="${MADRID_MARK_VIEWBOX}" rx="${MADRID_MARK_PLATE_RADIUS}" fill="url(#${gradientId}Sheen)"/>`;
}

export function engravedMark(ink, shadow, highlight, id = 'madridMark') {
  return `<g id="${id}" fill="${ink}" clip-path="url(#madridMarkClip)">
    <rect width="${MADRID_MARK_VIEWBOX}" height="${MADRID_MARK_VIEWBOX}"/>
  </g>
  <g id="${id}Shadow" fill="${shadow}" fill-opacity="0.38" clip-path="url(#madridMarkClip)" transform="translate(-6 -7)">
    <rect width="${MADRID_MARK_VIEWBOX}" height="${MADRID_MARK_VIEWBOX}"/>
  </g>
  <g id="${id}Highlight" fill="${highlight}" fill-opacity="0.28" clip-path="url(#madridMarkClip)" transform="translate(6 8)">
    <rect width="${MADRID_MARK_VIEWBOX}" height="${MADRID_MARK_VIEWBOX}"/>
  </g>`;
}

function fixedIconSvg({ plate, plateTop, sheen, ink, shadow, highlight }) {
  const gradientId = 'madridPlateShade';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MADRID_MARK_VIEWBOX} ${MADRID_MARK_VIEWBOX}" fill="none">
  <!-- Madrid: quiet wrought-iron M, not a civic crest. -->
  <defs>
  ${plateShadeDefs(gradientId, plateTop, plate, sheen)}
  ${markClip()}
  </defs>
  ${plateRects(gradientId)}
  ${engravedMark(ink, shadow, highlight)}
</svg>
`;
}

export const lightMark = {
  plate: NOTA_PLATE_BLACK,
  plateTop: NOTA_PLATE_SHADE_TOP,
  sheen: '#E8D4B0',
  ink: NOTA_INK_PAPER,
  shadow: '#000000',
  highlight: NOTA_INK_HIGHLIGHT,
};

export const darkMark = {
  plate: NOTA_INK_PAPER,
  plateTop: NOTA_INK_HIGHLIGHT,
  sheen: '#FFFFFF',
  ink: MADRID_DARK_INK,
  shadow: '#6E6256',
  highlight: '#FFFFFF',
};

export function renderIconLightSvg() {
  return fixedIconSvg(lightMark);
}

export function renderIconDarkSvg() {
  return fixedIconSvg(darkMark);
}

export function renderFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MADRID_MARK_VIEWBOX} ${MADRID_MARK_VIEWBOX}" fill="none">
  <!-- Madrid: quiet wrought-iron M, not a civic crest. -->
  <defs>
  ${plateShadeDefs('madridFaviconLight', lightMark.plateTop, lightMark.plate, lightMark.sheen)}
  ${plateShadeDefs('madridFaviconDark', darkMark.plateTop, darkMark.plate, darkMark.sheen)}
  ${markClip()}
  </defs>
  <style>
    .madrid-favicon-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .madrid-favicon-light { display: none; }
      .madrid-favicon-dark { display: inline; }
    }
  </style>
  <g class="madrid-favicon-light">
    ${plateRects('madridFaviconLight', 'madridPlateLight')}
    ${engravedMark(lightMark.ink, lightMark.shadow, lightMark.highlight, 'madridMarkLight')}
  </g>
  <g class="madrid-favicon-dark">
    ${plateRects('madridFaviconDark', 'madridPlateDark')}
    ${engravedMark(darkMark.ink, darkMark.shadow, darkMark.highlight, 'madridMarkDark')}
  </g>
</svg>
`;
}
