import { describe, expect, it, vi } from 'vitest';

import {
  blogPostUrl,
  formatBlogDate,
  isBlogPostPublished,
  sortBlogPostsByDate,
  type BlogPost,
} from './blog';

function post(id: string, pubDate: Date, draft?: boolean): BlogPost {
  return { id, data: { pubDate, draft } } as unknown as BlogPost;
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
    const sorted = sortBlogPostsByDate(posts);

    // Assert
    expect(sorted.map((p) => p.id)).toEqual(['newest', 'middle', 'older']);
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
    expect(posts.map((p) => p.id)).toEqual(['older', 'newest']);
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
