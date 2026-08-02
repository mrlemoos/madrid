import { describe, expect, it } from 'vitest';
import {
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
  authPathnameForScreenKind,
  isClerkAuthPathname,
  screenKindForAuthPathname,
} from './app-navigation-auth.js';

describe('app-navigation-auth', () => {
  it('recognises Clerk auth pathnames including legacy aliases', () => {
    // Arrange / Act / Assert
    expect(isClerkAuthPathname('/sign-in')).toBe(true);
    expect(isClerkAuthPathname('/sign-up/continue')).toBe(true);
    expect(isClerkAuthPathname('/login')).toBe(true);
    expect(isClerkAuthPathname('/signup')).toBe(true);
    expect(isClerkAuthPathname('/notes')).toBe(false);
  });

  it('maps screen kinds to Clerk pathnames', () => {
    // Arrange / Act / Assert
    expect(authPathnameForScreenKind('login')).toBe(CLERK_SIGN_IN_PATH);
    expect(authPathnameForScreenKind('signup')).toBe(CLERK_SIGN_UP_PATH);
  });

  it('resolves screen kind from pathname', () => {
    // Arrange / Act / Assert
    expect(screenKindForAuthPathname('/sign-in')).toBe('login');
    expect(screenKindForAuthPathname('/sign-up/sso')).toBe('signup');
    expect(screenKindForAuthPathname('/login')).toBe('login');
    expect(screenKindForAuthPathname('/signup')).toBe('signup');
    expect(screenKindForAuthPathname('/notes')).toBeNull();
  });
});
