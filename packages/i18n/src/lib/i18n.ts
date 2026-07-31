import EN_CA_MESSAGES from './locales/en-ca.json' with { type: 'json' };
import EN_GB_MESSAGES from './locales/en-gb.json' with { type: 'json' };
import ES_ES_MESSAGES from './locales/es-es.json' with { type: 'json' };
import FR_CA_MESSAGES from './locales/fr-ca.json' with { type: 'json' };
import PT_BR_MESSAGES from './locales/pt-br.json' with { type: 'json' };

export const EN_GB = 'en-GB' as const;
export type SupportedLocale = 'en-GB' | 'en-CA' | 'es-ES' | 'pt-BR' | 'fr-CA';

export const LOCALE_OPTIONS = [
  { value: 'system' as const, label: 'System default' },
  { value: EN_GB, label: 'English (United Kingdom)' },
  { value: 'en-CA' as const, label: 'English (Canada)' },
  { value: 'es-ES' as const, label: 'Spanish (Spain)' },
  { value: 'pt-BR' as const, label: 'Portuguese (Brazil)' },
  { value: 'fr-CA' as const, label: 'French (Canada)' },
] as const;

/**
 * User's preferred locale, or null/undefined to use system default.
 * Runtime validates and resolves to a SupportedLocale.
 */
export type LocalePreference = string | null | undefined;

/** Placeholder values for string interpolation, e.g. {totalCount} -> 3 */
export type PlaceholderValues = Record<string, string | number | boolean>;

type LocaleDictionary = Record<string, string>;

const LABEL_TO_LOCALE: Map<string, SupportedLocale> = new Map([
  ['english (united kingdom)', 'en-GB'],
  ['english (canada)', 'en-CA'],
  ['spanish (spain)', 'es-ES'],
  ['portuguese (brazil)', 'pt-BR'],
  ['french (canada)', 'fr-CA'],
]);

const LOCALE_LANGUAGE_TO_CODES: Map<string, readonly SupportedLocale[]> =
  new Map([
    ['en', ['en-GB', 'en-CA']],
    ['es', ['es-ES']],
    ['pt', ['pt-BR']],
    ['fr', ['fr-CA']],
  ]);

/**
 * Translation dictionary for each supported locale.
 * en-GB is the base (its file is an identity map used to derive TranslationKey),
 * so it is looked up as-is; every other locale has its own ./locales/<locale>.json.
 */
const TRANSLATIONS: Record<
  Exclude<SupportedLocale, 'en-GB'>,
  LocaleDictionary
> = {
  'en-CA': EN_CA_MESSAGES,
  'es-ES': ES_ES_MESSAGES,
  'pt-BR': PT_BR_MESSAGES,
  'fr-CA': FR_CA_MESSAGES,
};

/**
 * Type-safe translation keys, derived from the base locale (en-GB) message file.
 * Use this type for autocomplete when calling t().
 */
export type TranslationKey = keyof typeof EN_GB_MESSAGES;

/**
 * Accepts any known translation key (with editor autocomplete) while still
 * allowing arbitrary strings, e.g. runtime-composed keys.
 */
export type TranslationKeyInput = TranslationKey | (string & {});

/**
 * Canonicalises a locale string using Intl API.
 * @param value - The locale string to canonicalise
 * @returns The canonical locale string or null if invalid
 */
function canonicaliseLocale(value: string): string | null {
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves a user preference string to a SupportedLocale.
 * @param value - The locale preference (may be label, code, or null)
 * @returns The matched SupportedLocale or null if not supported
 */
function resolveSupportedLocale(
  value: string | null | undefined,
): SupportedLocale | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.toLowerCase() === 'system') {
    return null;
  }

  const labelMatch = LABEL_TO_LOCALE.get(trimmed.toLowerCase());
  if (labelMatch) {
    return labelMatch;
  }

  const canonical = canonicaliseLocale(trimmed);
  if (!canonical) {
    return null;
  }

  if (
    canonical === EN_GB ||
    canonical === 'en-CA' ||
    canonical === 'es-ES' ||
    canonical === 'pt-BR' ||
    canonical === 'fr-CA'
  ) {
    return canonical;
  }

  const language = canonical.split('-')[0];
  const candidates = LOCALE_LANGUAGE_TO_CODES.get(language);
  return candidates?.[0] ?? null;
}

/**
 * Gets the navigator object safely, handling SSR and restricted contexts.
 * @returns Navigator-like object with languages and language, or null
 */
function getNavigator(): {
  languages: readonly string[];
  language: string;
} | null {
  try {
    const nav = globalThis.navigator as
      | { languages: readonly string[]; language: string }
      | undefined
      | null;
    return nav ?? null;
  } catch {
    return null;
  }
}

/**
 * Gets the user's system locale preferences from the browser.
 * @returns Array of locale codes from navigator.languages and navigator.language
 */
export function getSystemLocaleCandidates(): readonly string[] {
  const nav = getNavigator();
  if (!nav) {
    return [];
  }

  const languageList: readonly string[] = Array.isArray(nav.languages)
    ? (nav.languages as readonly string[])
    : [];
  const allItems = [...languageList, nav.language].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  return [...new Set(allItems)];
}

/**
 * Resolves the effective locale to use for translations.
 * Priority: explicit preference > system locale > en-GB fallback.
 * @param preference - User's locale preference (may be null/undefined for system)
 * @param systemLocales - Array of system locale codes to fallback to
 * @returns The resolved SupportedLocale
 */
export function resolveLocale(
  preference: LocalePreference,
  systemLocales: readonly string[] = getSystemLocaleCandidates(),
): SupportedLocale {
  const explicitLocale = resolveSupportedLocale(preference);
  if (explicitLocale) {
    return explicitLocale;
  }

  for (const candidate of systemLocales) {
    const locale = resolveSupportedLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return EN_GB;
}

/**
 * Creates a translator function for the given locale preference.
 * @param preference - User's locale preference (null/undefined uses system)
 * @param systemLocales - System locale candidates for fallback
 * @returns Object containing resolved locale and translate function
 */
export function createTranslator(
  preference: LocalePreference,
  systemLocales: readonly string[] = getSystemLocaleCandidates(),
): {
  locale: SupportedLocale;
  t: (key: TranslationKeyInput, values?: PlaceholderValues) => string;
} {
  const locale = resolveLocale(preference, systemLocales);
  return {
    locale,
    t: (key: TranslationKeyInput, values?: PlaceholderValues) => {
      // en-GB is the base language: keys are already British English.
      if (locale === EN_GB) {
        return replacePlaceholders(key, values);
      }
      const dict = TRANSLATIONS[locale];
      const translated = dict[key] || key;
      return replacePlaceholders(translated, values);
    },
  };
}

/**
 * Replaces {placeholder} patterns in a string with values from the provided object.
 * @param text - The template string with {placeholder} patterns
 * @param values - Object mapping placeholder names to replacement values
 * @returns The string with all placeholders replaced
 */
function replacePlaceholders(text: string, values?: PlaceholderValues): string {
  if (!values) {
    return text;
  }
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const v = values[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (v !== undefined) {
      return String(v);
    }
    return `{${key}}`;
  });
}

/**
 * Translates a key to the user's locale, with optional placeholder interpolation.
 * @param key - Translation key in British English (e.g. "Folder", "New folder")
 * @param preference - User's locale preference (null/undefined uses system)
 * @param values - Optional placeholder values for interpolation (e.g. {totalCount}: 3)
 * @returns Translated string with placeholders replaced
 */
export function t(
  key: TranslationKeyInput,
  preference: LocalePreference,
  values?: PlaceholderValues,
): string {
  return createTranslator(preference).t(key, values);
}
