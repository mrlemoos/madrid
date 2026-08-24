/** Engraved Didot N: paper ink on a black, warm-shaded plate. */

export const NOTA_N_VIEWBOX = 512;
/** Electron `dock.setIcon` paints the PNG as-is — plate must carry the radius. */
export const NOTA_N_PLATE_RADIUS = 114;

export const NOTA_PLATE_BLACK = '#000000';
export const NOTA_PLATE_SHADE_TOP = '#241C14';
export const NOTA_SHEEN = '#E8D4B0';
export const NOTA_INK_PAPER = '#E8DCC8';
export const NOTA_INK_HIGHLIGHT = '#F7EFE2';

export const NOTA_N_STEM_WIDTH = 92;
export const NOTA_N_SERIF_THICKNESS = 12;

const PLATE = NOTA_N_VIEWBOX;
const OUTER = 78;
const SERIF_OVERHANG = 12;
const DIAG_THICKNESS = 38;

function buildDidotNPath() {
  const W = NOTA_N_STEM_WIDTH;
  const S = NOTA_N_SERIF_THICKNESS;
  const L = OUTER;
  const T = OUTER;
  const R = PLATE - OUTER;
  const B = PLATE - OUTER;
  const leftOuter = L + SERIF_OVERHANG;
  const leftInner = leftOuter + W;
  const rightOuter = R - SERIF_OVERHANG;
  const rightInner = rightOuter - W;
  const serifRight = leftInner + 32;
  const serifLeft = rightInner - 32;
  const stemTop = T + S;
  const stemBottom = B - S;
  const diagOuterY = stemBottom - DIAG_THICKNESS;
  const diagInnerY = stemTop + DIAG_THICKNESS;

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
    `L${rightInner} ${diagOuterY}`,
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
    `L${rightInner} ${stemBottom}`,
    `L${leftInner} ${diagInnerY}`,
    `L${leftInner} ${stemBottom}`,
    `L${serifRight} ${stemBottom}`,
    `L${serifRight} ${B}`,
    'Z',
  ].join(' ');
}

export const NOTA_N_PATH = buildDidotNPath();

/** Cropped to the N with a little optical padding. */
export const NOTA_N_LOGO_VIEWBOX = '62 62 388 388';

function nPath(id, extraAttr) {
  return `    <path id="${id}" d="${NOTA_N_PATH}" ${extraAttr}/>`;
}

function plateRect(id, fillAttr) {
  return `<rect id="${id}" width="${NOTA_N_VIEWBOX}" height="${NOTA_N_VIEWBOX}" rx="${NOTA_N_PLATE_RADIUS}" ${fillAttr}/>`;
}

function plateShadeDefs() {
  return `<defs>
  <linearGradient id="notaPlateShade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${NOTA_PLATE_SHADE_TOP}"/>
    <stop offset="0.38" stop-color="${NOTA_PLATE_BLACK}"/>
    <stop offset="1" stop-color="${NOTA_PLATE_BLACK}"/>
  </linearGradient>
  <linearGradient id="notaPlateSheen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${NOTA_SHEEN}" stop-opacity="0.14"/>
    <stop offset="0.2" stop-color="${NOTA_SHEEN}" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="notaNClip">
    <path d="${NOTA_N_PATH}"/>
  </clipPath>
</defs>`;
}

function engravedN() {
  return `<g clip-path="url(#notaNClip)">
${nPath('notaN', `fill="${NOTA_INK_PAPER}"`)}
${nPath('notaNShadow', 'fill="#000000" fill-opacity="0.38" transform="translate(-6 -7)"')}
${nPath('notaNHighlight', `fill="${NOTA_INK_HIGHLIGHT}" fill-opacity="0.28" transform="translate(6 8)"`)}
</g>`;
}

function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${NOTA_N_VIEWBOX} ${NOTA_N_VIEWBOX}" fill="none">
  <!-- Nota engraved Didot N · black warm-shaded plate (Electron Dock PNG is unmasked) -->
  ${plateShadeDefs()}
  ${plateRect('notaPlate', 'fill="url(#notaPlateShade)"')}
  ${plateRect('notaPlateSheen', 'fill="url(#notaPlateSheen)"')}
${engravedN()}
</svg>
`;
}

export function renderIconLightSvg() {
  return iconSvg();
}

export function renderIconDarkSvg() {
  return iconSvg();
}

export function renderFaviconSvg() {
  return iconSvg();
}
