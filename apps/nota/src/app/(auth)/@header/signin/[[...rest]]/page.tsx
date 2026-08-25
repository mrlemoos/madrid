'use client';

import type { JSX } from 'react';
import { AuthCardTitle } from '@/components/auth-card-title';
import { useNotaTranslator } from '@/lib/use-nota-translator';

/** `@header` slot for `/signin`. */
export default function SignInHeader(): JSX.Element {
  const { t } = useNotaTranslator();
  return (
    <AuthCardTitle description={t('Enter your email to sign in.')}>
      {t('Sign in')}
    </AuthCardTitle>
  );
}
