import { useMemo } from 'react';
import { createTranslator, type SupportedLocale } from '@nota/i18n';
import { useNotaPreferencesStore } from '@nota/note-runtime/stores/preferences';

export function useWritingActivityTranslator(): {
  locale: SupportedLocale;
  t: ReturnType<typeof createTranslator>['t'];
} {
  const preference = useNotaPreferencesStore(({ locale }) => locale);
  return useMemo(() => {
    const { locale, t } = createTranslator(preference);
    return { locale, t };
  }, [preference]);
}
