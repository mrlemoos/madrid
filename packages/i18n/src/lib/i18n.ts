import {
  CHROME_UI_ES,
  CHROME_UI_FR,
  CHROME_UI_PT,
} from './chrome-ui-translations.js';
import {
  SHORTCUT_TRANSLATIONS_ES,
  SHORTCUT_TRANSLATIONS_FR,
  SHORTCUT_TRANSLATIONS_PT,
} from './shortcut-catalogue-translations.js';

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

const FOLDER_CORE_ES: LocaleDictionary = {
  Folder: 'Carpeta',
  'Move folder': 'Mover carpeta',
  'Create note': 'Crear nota',
  'Create folder': 'Crear carpeta',
  'New folder': 'Nueva carpeta',
  'New subfolder': 'Nueva subcarpeta',
  'Tint folder': 'Teñir carpeta',
  'Tint folder…': 'Teñir carpeta…',
  'Tint folder: pick folder': 'Teñir carpeta: elegir carpeta',
  'Tint folder: choose colour': 'Teñir carpeta: elegir color',
  'Folder tint Default': 'Predeterminado',
  'Folder tint Blue': 'Azul',
  'Folder tint Green': 'Verde',
  'Folder tint Red': 'Rojo',
  'Folder tint Orange': 'Naranja',
  'Folder tint Purple': 'Morado',
  'Folder tint Teal': 'Verde azulado',
  'Folder tint Rose': 'Rosa',
  'Folder tint Slate': 'Gris pizarra',
  ' / ': ' / ',
  'No notes in this folder.': 'No hay notas en esta carpeta.',
  Name: 'Nombre',
  Cancel: 'Cancelar',
  Back: 'Atrás',
  Create: 'Crear',
  'Creating…': 'Creando…',
  'Enter a folder name.': 'Introduce un nombre de carpeta.',
  'Failed to create folder.': 'No se pudo crear la carpeta.',
  'Cancel and delete folder': 'Cancelar y eliminar carpeta',
  'Delete folder "{folderName}"?': '¿Eliminar carpeta "{folderName}"?',
  'This value is {totalCount}': 'Este valor es {totalCount}',
};

const FOLDER_CORE_PT: LocaleDictionary = {
  Folder: 'Pasta',
  'Move folder': 'Mover pasta',
  'Create note': 'Criar nota',
  'Create folder': 'Criar pasta',
  'New folder': 'Nova pasta',
  'New subfolder': 'Nova subpasta',
  'Tint folder': 'Colorir pasta',
  'Tint folder…': 'Colorir pasta…',
  'Tint folder: pick folder': 'Colorir pasta: escolher pasta',
  'Tint folder: choose colour': 'Colorir pasta: escolher cor',
  'Folder tint Default': 'Predefinição',
  'Folder tint Blue': 'Azul',
  'Folder tint Green': 'Verde',
  'Folder tint Red': 'Vermelho',
  'Folder tint Orange': 'Laranja',
  'Folder tint Purple': 'Roxo',
  'Folder tint Teal': 'Azul-petróleo',
  'Folder tint Rose': 'Rosa',
  'Folder tint Slate': 'Cinza ardósia',
  ' / ': ' / ',
  'No notes in this folder.': 'Não há notas nesta pasta.',
  Name: 'Nome',
  Cancel: 'Cancelar',
  Back: 'Voltar',
  Create: 'Criar',
  'Creating…': 'Criando…',
  'Enter a folder name.': 'Digite um nome para a pasta.',
  'Failed to create folder.': 'Falha ao criar a pasta.',
  'Cancel and delete folder': 'Cancelar e excluir pasta',
  'Delete folder "{folderName}"?': 'Excluir pasta "{folderName}"?',
  'This value is {totalCount}': 'Este valor é {totalCount}',
};

const FOLDER_CORE_FR: LocaleDictionary = {
  Folder: 'Dossier',
  'Move folder': 'Déplacer le dossier',
  'Create note': 'Créer une note',
  'Create folder': 'Créer un dossier',
  'New folder': 'Nouveau dossier',
  'New subfolder': 'Nouveau sous-dossier',
  'Tint folder': 'Teinte du dossier',
  'Tint folder…': 'Teinte du dossier…',
  'Tint folder: pick folder': 'Teinte du dossier: choisir le dossier',
  'Tint folder: choose colour': 'Teinte du dossier: choisir la couleur',
  'Folder tint Default': 'Par défaut',
  'Folder tint Blue': 'Bleu',
  'Folder tint Green': 'Vert',
  'Folder tint Red': 'Rouge',
  'Folder tint Orange': 'Orange',
  'Folder tint Purple': 'Violet',
  'Folder tint Teal': 'Sarcelle',
  'Folder tint Rose': 'Rose',
  'Folder tint Slate': 'Gris ardoise',
  ' / ': ' / ',
  'No notes in this folder.': 'Aucune note dans ce dossier.',
  Name: 'Nom',
  Cancel: 'Annuler',
  Back: 'Retour',
  Create: 'Créer',
  'Creating…': 'Création…',
  'Enter a folder name.': 'Entrez un nom de dossier.',
  'Failed to create folder.': 'Échec de la création du dossier.',
  'Cancel and delete folder': 'Annuler et supprimer le dossier',
  'Delete folder "{folderName}"?': 'Supprimer le dossier "{folderName}"?',
  'This value is {totalCount}': 'Cette valeur est {totalCount}',
};

const NOTE_GRAPH_ES: LocaleDictionary = {
  'Note Graph': 'Grafo de notas',
  'How your notes link together. Click a note to open it. Pan and zoom to explore.':
    'Cómo se enlazan tus notas. Haz clic en una nota para abrirla. Arrastra y amplía para explorar.',
  'Loading graph…': 'Cargando gráfico…',
  'No notes to show.': 'No hay notas que mostrar.',
  'Every note is hidden from the graph. Open a note and turn on ':
    'Todas las notas están ocultas en el gráfico. Abre una nota y activa ',
  'Show in note graph': 'Mostrar en el gráfico de notas',
  ' in the note layout menu (typography icon next to the title).':
    ' en el menú de diseño de la nota (icono de tipografía junto al título).',
};

const NOTE_GRAPH_PT: LocaleDictionary = {
  'Note Graph': 'Gráfico de notas',
  'How your notes link together. Click a note to open it. Pan and zoom to explore.':
    'Como as suas notas se ligam. Clique numa nota para abrir. Arraste e amplie para explorar.',
  'Loading graph…': 'A carregar gráfico…',
  'No notes to show.': 'Nenhuma nota para mostrar.',
  'Every note is hidden from the graph. Open a note and turn on ':
    'Todas as notas estão ocultas no gráfico. Abra uma nota e ative ',
  'Show in note graph': 'Mostrar no gráfico de notas',
  ' in the note layout menu (typography icon next to the title).':
    ' no menu de layout da nota (ícone de tipografia junto ao título).',
};

const NOTE_GRAPH_FR: LocaleDictionary = {
  'Note Graph': 'Graphique des notes',
  'How your notes link together. Click a note to open it. Pan and zoom to explore.':
    'Comment vos notes sont reliées. Cliquez sur une note pour l’ouvrir. Déplacez et zoomez pour explorer.',
  'Loading graph…': 'Chargement du graphique…',
  'No notes to show.': 'Aucune note à afficher.',
  'Every note is hidden from the graph. Open a note and turn on ':
    'Chaque note est masquée dans le graphique. Ouvrez une note et activez ',
  'Show in note graph': 'Afficher dans le graphique des notes',
  ' in the note layout menu (typography icon next to the title).':
    ' dans le menu de mise en page de la note (icône de typographie à côté du titre).',
};

const NOTE_BACKLINKS_ES: LocaleDictionary = {
  Backlinks: 'Retroenlaces',
  'No other notes link here yet.': 'Aún no hay otras notas que enlacen aquí.',
  'Untitled Note': 'Nota sin título',
};

const NOTE_BACKLINKS_PT: LocaleDictionary = {
  Backlinks: 'Ligações de retorno',
  'No other notes link here yet.': 'Ainda não há outras notas que liguem aqui.',
  'Untitled Note': 'Nota sem título',
};

const NOTE_BACKLINKS_FR: LocaleDictionary = {
  Backlinks: 'Rétroliens',
  'No other notes link here yet.':
    'Aucune autre note ne renvoie ici pour le moment.',
  'Untitled Note': 'Note sans titre',
};

const ELECTRON_UPDATE_ES: LocaleDictionary = {
  'Desktop app updates': 'Actualizaciones de la app de escritorio',
  'Nota checks GitHub Releases for the latest signed Mac build.':
    'Nota consulta las versiones publicadas en GitHub para la última compilación firmada para Mac.',
  'Check for updates': 'Buscar actualizaciones',
  'Checking for updates…': 'Buscando actualizaciones…',
  "You're on the latest version.": 'Tienes la última versión.',
  'Update {version} is available.':
    'Hay una actualización disponible: {version}.',
  'Downloading update… {percent}%': 'Descargando actualización… {percent} %',
  'Update ready. Restart Nota to finish installing.':
    'Actualización lista. Reinicia Nota para terminar la instalación.',
  'Restart and update': 'Reiniciar e instalar',
  'Update check failed: {message}':
    'Error al buscar actualizaciones: {message}',
  'Updates are only checked in the packaged Mac app.':
    'Las actualizaciones solo se buscan en la app empaquetada para Mac.',
};

const ELECTRON_UPDATE_PT: LocaleDictionary = {
  'Desktop app updates': 'Atualizações da app para computador',
  'Nota checks GitHub Releases for the latest signed Mac build.':
    'O Nota verifica as versões publicadas no GitHub para a última compilação assinada para Mac.',
  'Check for updates': 'Procurar atualizações',
  'Checking for updates…': 'A procurar atualizações…',
  "You're on the latest version.": 'Está na versão mais recente.',
  'Update {version} is available.': 'Está disponível a atualização {version}.',
  'Downloading update… {percent}%': 'A transferir atualização… {percent} %',
  'Update ready. Restart Nota to finish installing.':
    'Atualização pronta. Reinicie o Nota para concluir a instalação.',
  'Restart and update': 'Reiniciar e atualizar',
  'Update check failed: {message}': 'Falha ao procurar atualizações: {message}',
  'Updates are only checked in the packaged Mac app.':
    'As atualizações só são verificadas na app empacotada para Mac.',
};

const ELECTRON_UPDATE_FR: LocaleDictionary = {
  'Desktop app updates': 'Mises à jour de l’app bureau',
  'Nota checks GitHub Releases for the latest signed Mac build.':
    'Nota consulte les versions publiées sur GitHub pour la dernière version signée pour Mac.',
  'Check for updates': 'Vérifier les mises à jour',
  'Checking for updates…': 'Vérification des mises à jour…',
  "You're on the latest version.": 'Vous utilisez la dernière version.',
  'Update {version} is available.': 'La mise à jour {version} est disponible.',
  'Downloading update… {percent}%':
    'Téléchargement de la mise à jour… {percent} %',
  'Update ready. Restart Nota to finish installing.':
    'Mise à jour prête. Redémarrez Nota pour terminer l’installation.',
  'Restart and update': 'Redémarrer et mettre à jour',
  'Update check failed: {message}':
    'Échec de la vérification des mises à jour : {message}',
  'Updates are only checked in the packaged Mac app.':
    'Les mises à jour ne sont vérifiées que dans l’application Mac empaquetée.',
};

const PLATFORM_LINK_PREVIEW_ES: LocaleDictionary = {
  'on Wikipedia': 'en Wikipedia',
};

const PLATFORM_LINK_PREVIEW_PT: LocaleDictionary = {
  'on Wikipedia': 'na Wikipédia',
};

const PLATFORM_LINK_PREVIEW_FR: LocaleDictionary = {
  'on Wikipedia': 'sur Wikipédia',
};

/**
 * Translation dictionary for each supported locale
 * (en-GB and en-CA use the key as-is).
 * Folder/dialog keys are merged last so they override any accidental key clash.
 */
const TRANSLATIONS: Record<
  Exclude<SupportedLocale, 'en-GB' | 'en-CA'>,
  LocaleDictionary
> = {
  'es-ES': {
    ...SHORTCUT_TRANSLATIONS_ES,
    ...CHROME_UI_ES,
    ...FOLDER_CORE_ES,
    ...NOTE_GRAPH_ES,
    ...NOTE_BACKLINKS_ES,
    ...ELECTRON_UPDATE_ES,
    ...PLATFORM_LINK_PREVIEW_ES,
  },
  'pt-BR': {
    ...SHORTCUT_TRANSLATIONS_PT,
    ...CHROME_UI_PT,
    ...FOLDER_CORE_PT,
    ...NOTE_GRAPH_PT,
    ...NOTE_BACKLINKS_PT,
    ...ELECTRON_UPDATE_PT,
    ...PLATFORM_LINK_PREVIEW_PT,
  },
  'fr-CA': {
    ...SHORTCUT_TRANSLATIONS_FR,
    ...CHROME_UI_FR,
    ...FOLDER_CORE_FR,
    ...NOTE_GRAPH_FR,
    ...NOTE_BACKLINKS_FR,
    ...ELECTRON_UPDATE_FR,
    ...PLATFORM_LINK_PREVIEW_FR,
  },
};

/**
 * Type-safe translation keys extracted from all translation dictionaries.
 * Use this type for autocomplete when calling t().
 */
export type TranslationKey = keyof (typeof TRANSLATIONS)['es-ES'];

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
      { languages: readonly string[]; language: string } | undefined | null;
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
  t: (key: string, values?: PlaceholderValues) => string;
} {
  const locale = resolveLocale(preference, systemLocales);
  return {
    locale,
    t: (key: string, values?: PlaceholderValues) => {
      // en-GB and en-CA return keys as-is (same language)
      if (locale === EN_GB || locale === 'en-CA') {
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
  key: string,
  preference: LocalePreference,
  values?: PlaceholderValues,
): string {
  return createTranslator(preference).t(key, values);
}
