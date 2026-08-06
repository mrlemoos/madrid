import { describe, expect, it } from 'vitest';
import { parseRedditUrl, redditPostJsonUrl } from './parse-reddit-url';

describe('parseRedditUrl', () => {
  it('detects a post URL', () => {
    // Arrange
    const url =
      'https://www.reddit.com/r/AskReddit/comments/abc123/some_title/';

    // Act
    const parsed = parseRedditUrl(url);

    // Assert
    expect(parsed).toEqual({
      kind: 'post',
      subreddit: 'AskReddit',
      postId: 'abc123',
    });
  });

  it('detects a subreddit homepage', () => {
    // Arrange
    const url = 'https://reddit.com/r/programming';

    // Act
    const parsed = parseRedditUrl(url);

    // Assert
    expect(parsed).toEqual({ kind: 'subreddit', subreddit: 'programming' });
  });

  it('treats subreddit tab paths as subreddit links', () => {
    // Arrange
    const url = 'https://www.reddit.com/r/programming/hot/';

    // Act
    const parsed = parseRedditUrl(url);

    // Assert
    expect(parsed).toEqual({ kind: 'subreddit', subreddit: 'programming' });
  });

  it('returns null for unrelated hosts', () => {
    // Arrange
    const url = 'https://example.com/r/foo';

    // Act
    const parsed = parseRedditUrl(url);

    // Assert
    expect(parsed).toBeNull();
  });
});

describe('redditPostJsonUrl', () => {
  it('builds a www json endpoint', () => {
    // Arrange
    // Act
    const jsonUrl = redditPostJsonUrl('test', 'xyz');

    // Assert
    expect(jsonUrl).toBe(
      'https://www.reddit.com/r/test/comments/xyz.json?raw_json=1&limit=1',
    );
  });
});
