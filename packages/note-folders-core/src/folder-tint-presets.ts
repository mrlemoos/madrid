import type { TranslationKey } from '@nota/i18n';

/** Persisted folder tint keys :  must match supabase check constraint `folders_tint_valid`. */
export const FOLDER_TINT_DB_VALUES = [
  'blue',
  'green',
  'red',
  'orange',
  'purple',
  'teal',
  'rose',
  'slate',
] as const;

export type FolderTintDbValue = (typeof FOLDER_TINT_DB_VALUES)[number];

export type FolderTintPresetId = 'default' | FolderTintDbValue;

export type FolderTintOption = {
  id: FolderTintPresetId;
  /** Value stored in `folders.tint`; `null` clears tint. */
  persistedTint: string | null;
  /** Solid fill for swatch and folder icon. */
  swatchColour: string;
  /** Subtle row background in the sidebar. */
  rowBackground: string;
};

const NEUTRAL_SWATCH = 'oklch(0.55 0.02 250)';

/**
 * Preset order: default (no tint) first, then chromatic tints.
 * `persistedTint` null corresponds to a cleared / default folder appearance.
 */
export const FOLDER_TINT_PRESETS: readonly FolderTintOption[] = [
  {
    id: 'default',
    persistedTint: null,
    swatchColour: NEUTRAL_SWATCH,
    rowBackground: 'transparent',
  },
  {
    id: 'blue',
    persistedTint: 'blue',
    swatchColour: 'oklch(0.55 0.15 250)',
    rowBackground: 'color-mix(in oklch, oklch(0.55 0.15 250) 14%, transparent)',
  },
  {
    id: 'green',
    persistedTint: 'green',
    swatchColour: 'oklch(0.55 0.14 145)',
    rowBackground: 'color-mix(in oklch, oklch(0.55 0.14 145) 14%, transparent)',
  },
  {
    id: 'red',
    persistedTint: 'red',
    swatchColour: 'oklch(0.55 0.2 25)',
    rowBackground: 'color-mix(in oklch, oklch(0.55 0.2 25) 14%, transparent)',
  },
  {
    id: 'orange',
    persistedTint: 'orange',
    swatchColour: 'oklch(0.62 0.17 55)',
    rowBackground: 'color-mix(in oklch, oklch(0.62 0.17 55) 14%, transparent)',
  },
  {
    id: 'purple',
    persistedTint: 'purple',
    swatchColour: 'oklch(0.52 0.19 290)',
    rowBackground: 'color-mix(in oklch, oklch(0.52 0.19 290) 14%, transparent)',
  },
  {
    id: 'teal',
    persistedTint: 'teal',
    swatchColour: 'oklch(0.52 0.1 200)',
    rowBackground: 'color-mix(in oklch, oklch(0.52 0.1 200) 14%, transparent)',
  },
  {
    id: 'rose',
    persistedTint: 'rose',
    swatchColour: 'oklch(0.58 0.14 15)',
    rowBackground: 'color-mix(in oklch, oklch(0.58 0.14 15) 14%, transparent)',
  },
  {
    id: 'slate',
    persistedTint: 'slate',
    swatchColour: 'oklch(0.5 0.02 250)',
    rowBackground: 'color-mix(in oklch, oklch(0.5 0.02 250) 18%, transparent)',
  },
] as const;

const DEFAULT_PRESET = FOLDER_TINT_PRESETS[0];

const byPersisted = new Map<string | null, FolderTintOption>([
  [null, DEFAULT_PRESET],
  ...FOLDER_TINT_PRESETS.filter((p) => p.persistedTint !== null).map(
    (p) => [p.persistedTint, p] as const,
  ),
]);

function isFolderTintDbValue(value: string): value is FolderTintDbValue {
  return (FOLDER_TINT_DB_VALUES as readonly string[]).includes(value);
}

/** Whether the folder row should use CSS tint accents on icon and name. */
export function folderHasPersistedTint(
  tint: string | null,
): tint is FolderTintDbValue {
  return tint !== null && tint !== '' && isFolderTintDbValue(tint);
}

/** Swatch / icon colour for a DB `tint` value. */
export function folderTintSwatchColour(tint: string | null): string {
  if (tint === null || tint === '') {
    return DEFAULT_PRESET.swatchColour;
  }
  if (!isFolderTintDbValue(tint)) {
    return DEFAULT_PRESET.swatchColour;
  }
  return byPersisted.get(tint)?.swatchColour ?? DEFAULT_PRESET.swatchColour;
}

/** Subtle background for the folder row. */
export function folderTintRowBackground(tint: string | null): string {
  if (tint === null || tint === '') {
    return DEFAULT_PRESET.rowBackground;
  }
  if (!isFolderTintDbValue(tint)) {
    return DEFAULT_PRESET.rowBackground;
  }
  return byPersisted.get(tint)?.rowBackground ?? DEFAULT_PRESET.rowBackground;
}

export function folderTintOptionForPersisted(
  tint: string | null,
): FolderTintOption {
  if (tint === null || tint === '') {
    return DEFAULT_PRESET;
  }
  if (!isFolderTintDbValue(tint)) {
    return DEFAULT_PRESET;
  }
  return byPersisted.get(tint) ?? DEFAULT_PRESET;
}

/** Options shown in the context menu (swatches only) :  includes default. */
export const FOLDER_TINT_SWATCH_PRESETS: readonly FolderTintOption[] =
  FOLDER_TINT_PRESETS;

/** Command palette: every row is a pickable colour including default. */
export const FOLDER_TINT_PALETTE_PRESETS: readonly FolderTintOption[] =
  FOLDER_TINT_PRESETS;

/** Maps preset id to `t()` keys for colour labels. */
export const FOLDER_TINT_PRESET_LABEL_KEY = {
  default: 'Folder tint Default',
  blue: 'Folder tint Blue',
  green: 'Folder tint Green',
  red: 'Folder tint Red',
  orange: 'Folder tint Orange',
  purple: 'Folder tint Purple',
  teal: 'Folder tint Teal',
  rose: 'Folder tint Rose',
  slate: 'Folder tint Slate',
} as const satisfies Record<FolderTintPresetId, TranslationKey>;
