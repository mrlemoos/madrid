/** Geometric N mark: fat diagonal (~1.7× stem), round terminals, flat plate. */

export const NOTA_N_VIEWBOX = 512;
export const NOTA_N_STEM_WIDTH = 60;
export const NOTA_N_DIAGONAL_WIDTH = 102;

export const NOTA_PLATE_LIGHT = '#D4CFC6';
export const NOTA_INK_LIGHT = '#1F1D1A';
export const NOTA_PLATE_DARK = '#2E2C29';
export const NOTA_INK_DARK = '#F2EDE4';

export const NOTA_N_LINES = {
  left: { x1: 148, y1: 126, x2: 148, y2: 386 },
  right: { x1: 364, y1: 126, x2: 364, y2: 386 },
  diagonal: { x1: 148, y1: 126, x2: 364, y2: 386 },
};

export const NOTA_N_STROKES = [
  { key: 'left', ...NOTA_N_LINES.left, width: NOTA_N_STEM_WIDTH },
  { key: 'right', ...NOTA_N_LINES.right, width: NOTA_N_STEM_WIDTH },
  { key: 'diagonal', ...NOTA_N_LINES.diagonal, width: NOTA_N_DIAGONAL_WIDTH },
];

/** Cropped to the N, including round caps (r = half stroke). */
export const NOTA_N_LOGO_VIEWBOX = '89 67 334 378';

function nStrokes() {
  return NOTA_N_STROKES.map(
    (stroke) =>
      `    <line x1="${stroke.x1}" y1="${stroke.y1}" x2="${stroke.x2}" y2="${stroke.y2}" stroke-width="${stroke.width}"/>`,
  ).join('\n');
}

function iconSvg(plate, ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${NOTA_N_VIEWBOX} ${NOTA_N_VIEWBOX}" fill="none">
  <!-- Nota geometric N · flat plate (macOS 26 cuts the squircle) -->
  <rect id="notaPlate" width="${NOTA_N_VIEWBOX}" height="${NOTA_N_VIEWBOX}" fill="${plate}"/>
  <g id="notaN" stroke="${ink}" stroke-linecap="round">
${nStrokes()}
  </g>
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
    .n { stroke: ${NOTA_INK_LIGHT}; }
    @media (prefers-color-scheme: dark) {
      .plate { fill: ${NOTA_PLATE_DARK}; }
      .n { stroke: ${NOTA_INK_DARK}; }
    }
  </style>
  <rect id="notaPlate" class="plate" width="${NOTA_N_VIEWBOX}" height="${NOTA_N_VIEWBOX}"/>
  <g id="notaN" class="n" stroke-linecap="round">
${nStrokes()}
  </g>
</svg>
`;
}
