/**
 * Class names for calm app micro-interactions (definitions in `apps/nota/styles.css`).
 *
 * Press feedback only on `:active` :  no hover motion on reading surfaces (sidebar rows, nav).
 * Press-in is faster than release (asymmetric); reading rows prefer opacity over scale.
 * Timing/scale tokens live in `@getmadrid/design/motion-tokens` (re-exported here).
 */

export {
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_PRESS_SCALE,
} from '@getmadrid/design/motion-tokens';

export const NOTA_PRESSABLE_CLASS = 'nota-pressable';
export const NOTA_CHROME_NAV_ITEM_CLASS = 'nota-chrome-nav-item';
export const NOTA_SIDEBAR_ROW_CLASS = 'nota-sidebar-row';
export const NOTA_SAVE_PULSE_CLASS = 'nota-save-pulse';
export const NOTA_CMDK_ITEM_CLASS = 'nota-cmdk-item';
