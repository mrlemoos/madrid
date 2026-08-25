'use client';

import type { JSX } from 'react';
import { AuthCardTitle } from '@/components/auth-card-title';
import { useNotaTranslator } from '@/lib/use-nota-translator';

/** `@header` slot for `/signup`. */
export default function SignUpHeader(): JSX.Element {
  const { t } = useNotaTranslator();
  return (
    <AuthCardTitle description={t('Enter your email to create an account.')}>
      {t('Sign up')}
    </AuthCardTitle>
  );
}
