import { describe, expect, it, vi } from 'vitest';

import {
  blogPostUrl,
  formatBlogDate,
  isBlogPostPublished,
  sortBlogPostsByDate,
} from './blog';

/**
 * `CollectionEntry<'blog'>` resolves to `any` until Astro generates its content
 * types, so the specs work against the shape these helpers actually read.
 */
type TestPost = { id: string; data: { pubDate: Date; draft?: boolean } };

function post(id: string, pubDate: Date, draft?: boolean): TestPost {
  return { id, data: { pubDate, draft } };
}

function ids(posts: readonly TestPost[]): string[] {
  return posts.map((entry) => entry.id);
}

describe('isBlogPostPublished', () => {
  it('shows drafts while developing', () => {
    // Arrange
    vi.stubEnv('PROD', false);

    // Act|Assert
    expect(isBlogPostPublished(post('a', new Date(), true))).toBe(true);
    vi.unstubAllEnvs();
  });

  it('hides drafts in a production build', () => {
    // Arrange
    vi.stubEnv('PROD', true);

    // Act|Assert
    expect(isBlogPostPublished(post('a', new Date(), true))).toBe(false);
    expect(isBlogPostPublished(post('b', new Date(), false))).toBe(true);
    expect(isBlogPostPublished(post('c', new Date()))).toBe(true);
    vi.unstubAllEnvs();
  });
});

describe('sortBlogPostsByDate', () => {
  it('puts the newest post first', () => {
    // Arrange
    const posts = [
      post('older', new Date('2025-01-01')),
      post('newest', new Date('2026-06-01')),
      post('middle', new Date('2025-09-01')),
    ];

    // Act
    const sorted = sortBlogPostsByDate(posts) as TestPost[];

    // Assert
    expect(ids(sorted)).toEqual(['newest', 'middle', 'older']);
  });

  it('leaves the given array untouched', () => {
    // Arrange
    const posts = [
      post('older', new Date('2025-01-01')),
      post('newest', new Date('2026-06-01')),
    ];

    // Act
    sortBlogPostsByDate(posts);

    // Assert
    expect(ids(posts)).toEqual(['older', 'newest']);
  });
});

describe('formatBlogDate', () => {
  it('renders a long British date', () => {
    // Arrange|Act|Assert
    expect(formatBlogDate(new Date(2026, 2, 4))).toBe('4 March 2026');
  });
});

describe('blogPostUrl', () => {
  it('nests posts under /blog', () => {
    // Arrange|Act|Assert
    expect(blogPostUrl('quiet-software')).toBe('/blog/quiet-software');
  });
});
