/** Geometric N mark: filled letterform, rounded plate. */

export const NOTA_N_VIEWBOX = 512;
/** Electron `dock.setIcon` paints the PNG as-is — plate must carry the radius. */
export const NOTA_N_PLATE_RADIUS = 114;

export const NOTA_PLATE_LIGHT = '#D4CFC6';
export const NOTA_INK_LIGHT = '#1F1D1A';
export const NOTA_PLATE_DARK = '#2E2C29';
export const NOTA_INK_DARK = '#F2EDE4';

/**
 * Filled grotesque N (square terminals, uniform stem).
 * Left bar 170–206, right bar 306–342, y 140–372.
 */
export const NOTA_N_PATH =
  'M170 372 L170 140 L206 140 L306 300 L306 140 L342 140 L342 372 L306 372 L206 212 L206 372 Z';

/** Cropped to the N with a little optical padding. */
export const NOTA_N_LOGO_VIEWBOX = '154 124 204 264';

function nPath(fillAttr) {
  return `    <path id="notaN" d="${NOTA_N_PATH}" ${fillAttr}/>`;
}

function plateRect(fillAttr) {
  return `<rect id="notaPlate" width="${NOTA_N_VIEWBOX}" height="${NOTA_N_VIEWBOX}" rx="${NOTA_N_PLATE_RADIUS}" ${fillAttr}/>`;
}

function iconSvg(plate, ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${NOTA_N_VIEWBOX} ${NOTA_N_VIEWBOX}" fill="none">
  <!-- Nota geometric N · rounded plate (Electron Dock PNG is unmasked) -->
  ${plateRect(`fill="${plate}"`)}
${nPath(`fill="${ink}"`)}
</svg>
`;
}

export function renderIconLightSvg() {
  return iconSvg(NOTA_PLATE_LIGHT, NOTA_INK_LIGHT);
}

export function renderIconDarkSvg() {
  return iconSvg(NOTA_PLATE_DARK, NOTA_INK_DARK);
}

export function renderFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${NOTA_N_VIEWBOX} ${NOTA_N_VIEWBOX}" fill="none">
  <!-- Nota geometric N · favicon (light + dark) -->
  <style>
    .plate { fill: ${NOTA_PLATE_LIGHT}; }
    .n { fill: ${NOTA_INK_LIGHT}; }
    @media (prefers-color-scheme: dark) {
      .plate { fill: ${NOTA_PLATE_DARK}; }
      .n { fill: ${NOTA_INK_DARK}; }
    }
  </style>
  ${plateRect('class="plate"')}
    <path id="notaN" class="n" d="${NOTA_N_PATH}"/>
</svg>
`;
}
