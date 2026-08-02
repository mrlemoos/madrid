/** Pathnames used by Clerk `<SignIn path="…" />` / `<SignUp path="…" />` (path routing). */
export const CLERK_SIGN_IN_PATH = '/sign-in';
export const CLERK_SIGN_UP_PATH = '/sign-up';

const AUTH_PATHNAME = /^\/(?:sign-in|sign-up|login|signup)(?:\/|$)/;

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
    pathname === CLERK_SIGN_IN_PATH ||
    pathname.startsWith(`${CLERK_SIGN_IN_PATH}/`) ||
    pathname === '/login' ||
    pathname.startsWith('/login/')
  ) {
    return 'login';
  }
  if (
    pathname === CLERK_SIGN_UP_PATH ||
    pathname.startsWith(`${CLERK_SIGN_UP_PATH}/`) ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/')
  ) {
    return 'signup';
  }
  return null;
}
