/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- expo-font expects require() for bundled font assets */
import {
  noteSurfaceFonts,
  type NoteEditorSettings,
  type NotaSurfaceFontRole,
} from '@nota/note-editor-settings';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

/** Registered `fontFamily` names (must match useFonts keys). */
export const NOTA_FONT_FAMILY = {
  inter: 'NotaInter',
  instrumentSerif: 'NotaInstrumentSerif',
  geistSans: 'NotaGeistSans',
  sourceSerif4: 'NotaSourceSerif4',
  nunito: 'NotaNunito',
} as const;

const NOTA_FONT_SOURCES = {
  [NOTA_FONT_FAMILY.inter]: require('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
  [NOTA_FONT_FAMILY.instrumentSerif]: require('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff'),
  [NOTA_FONT_FAMILY.geistSans]: require('@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff'),
  [NOTA_FONT_FAMILY.sourceSerif4]: require('@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2'),
  [NOTA_FONT_FAMILY.nunito]: require('@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2'),
} as const;

const SYSTEM_MONO =
  Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) || 'monospace';

export function useNotaFonts(): boolean {
  const [loaded] = useFonts(NOTA_FONT_SOURCES);
  return loaded;
}

export function notaFontFamilyForRole(role: NotaSurfaceFontRole): string {
  if (role === 'systemMono') {
    return SYSTEM_MONO;
  }
  return NOTA_FONT_FAMILY[role];
}

export function notaSurfaceFontFamilies(settings: NoteEditorSettings): {
  titleFontFamily: string;
  bodyFontFamily: string;
} {
  const surface = noteSurfaceFonts(settings);
  return {
    titleFontFamily: notaFontFamilyForRole(surface.title),
    bodyFontFamily: notaFontFamilyForRole(surface.body),
  };
}
