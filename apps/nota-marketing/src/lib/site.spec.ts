import { describe, expect, it } from 'vitest';

import {
  NOTA_APP_URL,
  NOTA_AUTHOR_NAME,
  NOTA_AUTHOR_URL,
  NOTA_DOWNLOAD_PATH,
  NOTA_GITHUB_LATEST,
  NOTA_GITHUB_RELEASES,
  NOTA_GITHUB_REPO,
} from './site';

describe('site constants', () => {
  it('derives the release links from the repo URL', () => {
    // Arrange|Act|Assert
    expect(NOTA_GITHUB_RELEASES).toBe(`${NOTA_GITHUB_REPO}/releases`);
    expect(NOTA_GITHUB_LATEST).toBe(`${NOTA_GITHUB_REPO}/releases/latest`);
  });

  it('keeps the download entry point on our own origin', () => {
    // Arrange|Act|Assert — a Vercel redirect fans this out to GitHub
    expect(NOTA_DOWNLOAD_PATH).toBe('/download');
  });

  it('points every outbound link at https', () => {
    // Arrange
    const links = [NOTA_GITHUB_REPO, NOTA_APP_URL, NOTA_AUTHOR_URL];

    // Act|Assert
    for (const link of links) {
      expect(new URL(link).protocol).toBe('https:');
    }
  });

  it('bylines Leonardo', () => {
    // Arrange|Act|Assert
    expect(NOTA_AUTHOR_NAME).toBe('Leonardo Lemos');
  });
});
