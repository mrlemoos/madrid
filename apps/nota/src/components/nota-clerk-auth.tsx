import { SignIn, SignUp } from '@clerk/react';
import { shadcn } from '@clerk/ui/themes';
import type { JSX } from 'react';

import { notaButtonVariants } from '@nota/design/button';
import { NotaLoadingStatus } from '@nota/design/spinner';
import { cn } from '@/lib/utils';

const authFallback = (
  <div className="py-6">
    <NotaLoadingStatus label="Loading…" spinnerSize="sm" />
  </div>
);

const clerkTransparentSurface = {
  background: 'transparent',
  backgroundColor: 'transparent',
  border: 'none',
  boxShadow: 'none',
} as const;

const clerkFieldInput = cn(
  'h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-xs',
  'text-foreground placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none',
  'dark:bg-input/30',
);

const clerkPrimaryButton = cn(
  notaButtonVariants({ variant: 'default', size: 'lg' }),
  'nota-pressable h-10 w-full touch-manipulation text-sm',
);

/** Nota glass-card auth: shadcn tokens, no nested Clerk card chrome. */
// Not exported: its inferred type reaches into @clerk/ui internals that can't be
// named portably (TS2742), and only the two components below use it.
const notaClerkAuthAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: 'none' as const,
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    fontFamily: 'var(--font-sans)',
    fontFamilyButtons: 'var(--font-sans)',
    colorBackground: 'transparent',
    borderRadius: '0.375rem',
    spacing: '0.75rem',
  },
  elements: {
    rootBox: 'nota-auth-clerk w-full max-w-none',
    cardBox: {
      ...clerkTransparentSurface,
      overflow: 'visible',
      width: '100%',
      maxWidth: '100%',
    },
    card: {
      ...clerkTransparentSurface,
      width: '100%',
      maxWidth: '100%',
      padding: 0,
      margin: 0,
      textAlign: 'left',
    },
    header: { display: 'none' },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    footer: { display: 'none' },
    footerAction: { display: 'none' },
    footerActionText: { display: 'none' },
    footerActionLink: { display: 'none' },
    main: 'w-full max-w-none gap-4 text-left',
    form: 'w-full max-w-none gap-4 text-left',
    formFieldRow: 'w-full gap-1.5 text-left',
    formField: 'w-full',
    formFieldInputGroup: 'w-full',
    formFieldLabel: 'text-left text-sm font-medium text-foreground',
    formFieldInput: clerkFieldInput,
    formFieldInput__error:
      'border-destructive focus-visible:ring-destructive/30',
    formFieldErrorText: 'text-left text-xs text-destructive',
    formFieldHintText: 'text-left text-xs text-muted-foreground',
    formButtonPrimary: clerkPrimaryButton,
    formButtonReset: cn(
      notaButtonVariants({ variant: 'ghost', size: 'sm' }),
      'text-muted-foreground',
    ),
    formFieldAction: cn(
      notaButtonVariants({ variant: 'link', size: 'sm' }),
      'h-auto p-0 text-sm font-normal',
    ),
    dividerLine: 'bg-border/50',
    dividerText:
      'text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground',
    identityPreview: 'rounded-lg border border-border/50 bg-muted/25',
    identityPreviewText: 'text-sm text-foreground',
    identityPreviewEditButton: cn(
      notaButtonVariants({ variant: 'link', size: 'sm' }),
      'h-auto p-0',
    ),
    alert:
      'rounded-lg border border-destructive/25 bg-destructive/10 text-left text-sm text-destructive',
    alertText: 'text-sm',
    otpCodeFieldInput: cn(clerkFieldInput, 'text-center tracking-[0.35em]'),
    formResendCodeLink: cn(
      notaButtonVariants({ variant: 'link', size: 'sm' }),
      'h-auto p-0',
    ),
    formFieldInputShowPasswordButton: cn(
      notaButtonVariants({ variant: 'ghost', size: 'icon-sm' }),
      'text-muted-foreground hover:text-foreground',
    ),
  },
};

/** Clerk `<SignIn />` on the App Router path route `/signin` (path routing). */
export function NotaClerkSignIn(): JSX.Element {
  return (
    <SignIn
      path="/signin"
      signUpUrl="/signup"
      appearance={notaClerkAuthAppearance}
      fallback={authFallback}
    />
  );
}

/** Clerk `<SignUp />` on the App Router path route `/signup` (path routing). */
export function NotaClerkSignUp(): JSX.Element {
  return (
    <SignUp
      path="/signup"
      signInUrl="/signin"
      appearance={notaClerkAuthAppearance}
      fallback={authFallback}
    />
  );
}
