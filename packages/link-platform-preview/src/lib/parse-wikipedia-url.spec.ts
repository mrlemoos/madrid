import { describe, expect, it } from 'vitest';
import {
  isWikipediaArticleUrl,
  parseWikipediaUrl,
  wikipediaSummaryApiUrl,
  wikipediaTitleFromSlug,
} from './parse-wikipedia-url';

describe('parseWikipediaUrl', () => {
  it('detects a standard article URL', () => {
    // Arrange
    const url = 'https://en.wikipedia.org/wiki/Alan_Turing';

    // Act
    const parsed = parseWikipediaUrl(url);

    // Assert
    expect(parsed).toEqual({
      kind: 'article',
      lang: 'en',
      titleSlug: 'Alan_Turing',
    });
  });

  it('detects mobile article URLs', () => {
    // Arrange
    const url = 'https://es.m.wikipedia.org/wiki/Espa%C3%B1a';

    // Act
    const parsed = parseWikipediaUrl(url);

    // Assert
    expect(parsed).toEqual({
      kind: 'article',
      lang: 'es',
      titleSlug: 'Espa%C3%B1a',
    });
  });

  it('detects legacy index.php article URLs', () => {
    // Arrange
    const url =
      'https://en.wikipedia.org/w/index.php?title=Alan_Turing&oldid=1';

    // Act
    const parsed = parseWikipediaUrl(url);

    // Assert
    expect(parsed).toEqual({
      kind: 'article',
      lang: 'en',
      titleSlug: 'Alan_Turing',
    });
  });

  it('returns null for special pages', () => {
    // Arrange
    const url = 'https://en.wikipedia.org/wiki/Special:Search';

    // Act
    const parsed = parseWikipediaUrl(url);

    // Assert
    expect(parsed).toBeNull();
  });

  it('returns null for unrelated hosts', () => {
    // Arrange
    const url = 'https://example.com/wiki/Foo';

    // Act
    const parsed = parseWikipediaUrl(url);

    // Assert
    expect(parsed).toBeNull();
  });
});

describe('wikipediaTitleFromSlug', () => {
  it('decodes underscores and percent-encoding', () => {
    // Arrange
    const slug = 'Alan_Turing';

    // Act
    const title = wikipediaTitleFromSlug(slug);

    // Assert
    expect(title).toBe('Alan Turing');
  });
});

describe('wikipediaSummaryApiUrl', () => {
  it('builds a REST summary endpoint', () => {
    // Arrange
    // Act
    const apiUrl = wikipediaSummaryApiUrl('en', 'Alan_Turing');

    // Assert
    expect(apiUrl).toBe(
      'https://en.wikipedia.org/api/rest_v1/page/summary/Alan_Turing',
    );
  });
});

describe('isWikipediaArticleUrl', () => {
  it('returns true for article URLs', () => {
    // Arrange
    const url = 'https://fr.wikipedia.org/wiki/Paris';

    // Act
    const result = isWikipediaArticleUrl(url);

    // Assert
    expect(result).toBe(true);
  });
});
