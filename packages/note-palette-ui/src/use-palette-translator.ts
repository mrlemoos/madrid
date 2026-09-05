import { useMemo } from 'react';
import { createTranslator, type SupportedLocale } from '@getmadrid/i18n';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

/** Named `useNotaTranslator` at the call sites; matches the per-package hook pattern. */
export function useNotaTranslator(): {
  locale: SupportedLocale;
  t: ReturnType<typeof createTranslator>['t'];
} {
  const preference = useNotaPreferencesStore(({ locale }) => locale);
  return useMemo(() => {
    const { locale, t } = createTranslator(preference);
    return { locale, t };
  }, [preference]);
}
