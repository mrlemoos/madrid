import { describe, expect, it } from 'vitest';
import {
  shouldOpenHttpUrlInSystemBrowser,
  shouldOpenInAppOAuthPopupWindow,
} from './window-open-policy.js';

describe('shouldOpenInAppOAuthPopupWindow', () => {
  it('allows Clerk hosted sign-in popups', () => {
    // Arrange
    const clerkSignIn =
      'https://cool-colt-46.accounts.dev/sign-in?redirect_url=nota%3A%2F%2Foauth-callback';

    // Act
    const result = shouldOpenInAppOAuthPopupWindow(clerkSignIn);

    // Assert
    expect(result).toBe(true);
  });

  it('allows Clerk Frontend API token refresh URLs', () => {
    // Arrange
    const tokenUrl =
      'https://clerk.nota.mrlemoos.dev/v1/client/sessions/sess_x/tokens';

    // Act
    const result = shouldOpenInAppOAuthPopupWindow(tokenUrl);

    // Assert
    expect(result).toBe(true);
  });

  it('does not treat link-preview destinations as OAuth popups', () => {
    // Arrange
    const previewTargets = [
      'https://example.com/article',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.reddit.com/r/programming/comments/abc/title/',
      'https://en.wikipedia.org/wiki/Nota',
      'https://checkout.stripe.com/c/pay/cs_test_abc',
    ];

    // Act
    const results = previewTargets.map(shouldOpenInAppOAuthPopupWindow);

    // Assert
    expect(results.every((r) => !r)).toBe(true);
  });
});

describe('shouldOpenHttpUrlInSystemBrowser', () => {
  it('returns true for http(s) URLs', () => {
    // Arrange
    const httpsUrl = 'https://example.com';
    const httpUrl = 'http://localhost:8787/health';

    // Act
    const httpsOk = shouldOpenHttpUrlInSystemBrowser(httpsUrl);
    const httpOk = shouldOpenHttpUrlInSystemBrowser(httpUrl);

    // Assert
    expect(httpsOk).toBe(true);
    expect(httpOk).toBe(true);
  });

  it('returns false for non-http(s) schemes', () => {
    // Arrange
    const notaUrl = 'nota://oauth-callback';

    // Act
    const result = shouldOpenHttpUrlInSystemBrowser(notaUrl);

    // Assert
    expect(result).toBe(false);
  });
});
