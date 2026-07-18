/**
 * Sidebar resize release: project momentum, then spring-settle to the clamp band.
 */

import { rubberbandBeyondClamp } from '@/lib/nota-rubberband';

/** Projection window (seconds) for release velocity. */
export const NOTA_SIDEBAR_RESIZE_PROJECT_S = 0.16;

/** Below this |velocity|, treat release as a rest (no projection). */
export const NOTA_SIDEBAR_RESIZE_NEGLIGIBLE_VELOCITY_PX_S = 40;

export type SidebarResizeSettle = {
  targetWidthPx: number;
  initialVelocityPxPerSec: number;
};

/** Live drag width: 1:1 in-band, Apple rubberband past min/max. */
export function computeSidebarResizeLiveWidth(params: {
  startWidthPx: number;
  deltaPx: number;
  minPx: number;
  maxPx: number;
}): number {
  const raw = params.startWidthPx + params.deltaPx;
  const dimension = Math.max(params.maxPx - params.minPx, 1);
  return rubberbandBeyondClamp(raw, params.minPx, params.maxPx, dimension);
}

/**
 * Resolves the spring settle target after a resize drag.
 * Always clamps — rubberband overshoot must not become the stored width.
 */
export function resolveSidebarResizeSettle(params: {
  widthPx: number;
  velocityPxPerSec: number;
  minPx: number;
  maxPx: number;
  projectS?: number;
  negligibleVelocityPxPerSec?: number;
}): SidebarResizeSettle {
  const projectS = params.projectS ?? NOTA_SIDEBAR_RESIZE_PROJECT_S;
  const negligible =
    params.negligibleVelocityPxPerSec ??
    NOTA_SIDEBAR_RESIZE_NEGLIGIBLE_VELOCITY_PX_S;

  const projected =
    Math.abs(params.velocityPxPerSec) < negligible
      ? params.widthPx
      : params.widthPx + params.velocityPxPerSec * projectS;

  const targetWidthPx = Math.min(
    params.maxPx,
    Math.max(params.minPx, Math.round(projected)),
  );

  return {
    targetWidthPx,
    initialVelocityPxPerSec: params.velocityPxPerSec,
  };
}
