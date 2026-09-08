import { describe, expect, it } from 'vitest';

import {
  SVGL_REDDIT_LOGO_URL,
  SVGL_WIKIPEDIA_LOGO_URL,
  SVGL_YOUTUBE_LOGO_URL,
  WIKIPEDIA_LOGO_URL,
} from './logos';

describe('platform logo URLs', () => {
  it('loads the third-party marks over https from svgl', () => {
    // Arrange
    const remote = [SVGL_REDDIT_LOGO_URL, SVGL_YOUTUBE_LOGO_URL];

    // Act|Assert
    for (const url of remote) {
      expect(new URL(url).protocol).toBe('https:');
      expect(new URL(url).host).toBe('svgl.app');
    }
  });

  it('serves the Wikipedia mark from our own origin', () => {
    // Arrange|Act|Assert — bundled under apps/nota/public, so a root-relative path
    expect(WIKIPEDIA_LOGO_URL.startsWith('/')).toBe(true);
    expect(WIKIPEDIA_LOGO_URL).toBe('/platform-logos/wikipedia.svg');
  });

  it('keeps the deprecated Wikipedia alias pointing at the canonical URL', () => {
    // Arrange|Act|Assert
    expect(SVGL_WIKIPEDIA_LOGO_URL).toBe(WIKIPEDIA_LOGO_URL);
  });
});
