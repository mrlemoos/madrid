/** Pathnames used by Clerk `<SignIn path="…" />` / `<SignUp path="…" />` (path routing). */
export const CLERK_SIGN_IN_PATH = '/signin';
export const CLERK_SIGN_UP_PATH = '/signup';

// Tolerate the legacy hyphenated `/sign-in` bookmarks alongside the canonical `/signin`.
const AUTH_PATHNAME = /^\/(?:sign-in|sign-up|login|signin|signup)(?:\/|$)/;

export function isClerkAuthPathname(pathname: string): boolean {
  return AUTH_PATHNAME.test(pathname);
}

export function authPathnameForScreenKind(
  kind: 'login' | 'signup',
): typeof CLERK_SIGN_IN_PATH | typeof CLERK_SIGN_UP_PATH {
  return kind === 'login' ? CLERK_SIGN_IN_PATH : CLERK_SIGN_UP_PATH;
}

export function screenKindForAuthPathname(
  pathname: string,
): 'login' | 'signup' | null {
  if (
    pathname === '/signin' ||
    pathname.startsWith('/signin/') ||
    pathname === '/sign-in' ||
    pathname.startsWith('/sign-in/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/')
  ) {
    return 'login';
  }
  if (
    pathname === '/signup' ||
    pathname.startsWith('/signup/') ||
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-up/')
  ) {
    return 'signup';
  }
  return null;
}
