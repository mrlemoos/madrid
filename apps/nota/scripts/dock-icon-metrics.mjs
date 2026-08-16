// Metrics for macOS dock PNGs (Tahoe safe-zone checks).
import fs from 'node:fs';
import sharp from 'sharp';

/** Opaque pixels must not appear in the outer margin band (macOS 26 squircle safe zone). */
export const DOCK_ICON_OUTER_MARGIN_RATIO = 0.12;

/** Maximum fraction of the canvas that opaque content may occupy (1 − 2× margin). */
export const DOCK_ICON_MAX_CONTENT_FILL_RATIO =
  1 - 2 * DOCK_ICON_OUTER_MARGIN_RATIO;

/**
 * @param {string} pngPath
 * @returns {Promise<{
 *   outerBandOpaqueCount: number,
 *   contentFillRatio: number,
 *   size: number,
 *   aabbCornerOpaque: boolean,
 * }>}
 */
export async function measureDockIconPng(pngPath) {
  if (!fs.existsSync(pngPath)) {
    throw new Error(`Missing dock icon: ${pngPath}`);
  }

  const { data, info } = await sharp(pngPath).raw().toBuffer({
    resolveWithObject: true,
  });
  const size = info.width;
  if (info.height !== size) {
    throw new Error(`Dock icon must be square: ${pngPath}`);
  }

  const band = Math.ceil(size * DOCK_ICON_OUTER_MARGIN_RATIO);
  let outerBandOpaqueCount = 0;
  let minX = size;
  let maxX = 0;
  let minY = size;
  let maxY = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const alpha = data[i + 3];
      if (alpha <= 128) {
        continue;
      }

      const inOuterBand =
        x < band || y < band || x >= size - band || y >= size - band;
      if (inOuterBand) {
        outerBandOpaqueCount++;
      }

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const contentW = maxX >= minX ? maxX - minX + 1 : 0;
  const contentH = maxY >= minY ? maxY - minY + 1 : 0;
  const contentFillRatio = Math.max(contentW, contentH) / size;
  const aabbCornerOpaque =
    minX < size && minY < size && data[(minY * size + minX) * 4 + 3] > 128;

  return { outerBandOpaqueCount, contentFillRatio, size, aabbCornerOpaque };
}
