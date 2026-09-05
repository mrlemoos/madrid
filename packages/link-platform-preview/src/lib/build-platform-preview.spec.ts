import { describe, expect, it } from 'vitest';
import {
  buildRedditPostPreview,
  buildYoutubeVideoPreview,
  buildWikipediaArticlePreview,
  stripYoutubeChannelTitleSuffix,
  WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY,
} from './build-platform-preview';

describe('buildRedditPostPreview', () => {
  it('formats op, bold title, and subreddit suffix', () => {
    // Arrange
    const input = {
      op: 'spez',
      postTitle: 'Hello world',
      subreddit: 'announcements',
      subredditAvatarUrl: 'https://reddit.example/sub.png',
      userAvatarUrl: 'https://reddit.example/user.png',
    };

    // Act
    const preview = buildRedditPostPreview(input);

    // Assert
    expect(preview.prefixText).toBe('u/spez ');
    expect(preview.boldText).toBe('Hello world');
    expect(preview.suffixText).toBe(' in r/announcements');
    expect(preview.logoUrl).toContain('reddit.svg');
    expect(preview.subredditAvatarUrl).toBe('https://reddit.example/sub.png');
    expect(preview.userAvatarUrl).toBe('https://reddit.example/user.png');
    expect(preview.postTitle).toBe('Hello world');
  });
});

describe('buildYoutubeVideoPreview', () => {
  it('bolds the video title before the channel suffix', () => {
    // Arrange
    const input = {
      videoTitle: 'My video',
      channelName: 'Madrid',
      thumbnailUrl: 'https://i.ytimg.com/vi/x/hqdefault.jpg',
      channelAvatarUrl: 'https://yt.example/avatar.jpg',
    };

    // Act
    const preview = buildYoutubeVideoPreview(input);

    // Assert
    expect(preview.boldText).toBe('My video');
    expect(preview.suffixText).toBe(' by Madrid');
    expect(preview.logoUrl).toContain('youtube.svg');
    expect(preview.thumbnailUrl).toBe('https://i.ytimg.com/vi/x/hqdefault.jpg');
    expect(preview.channelAvatarUrl).toBe('https://yt.example/avatar.jpg');
  });
});

describe('stripYoutubeChannelTitleSuffix', () => {
  it('removes trailing YouTube branding', () => {
    // Arrange
    const title = 'Madrid Labs - YouTube';

    // Act
    const stripped = stripYoutubeChannelTitleSuffix(title);

    // Assert
    expect(stripped).toBe('Madrid Labs');
  });
});

describe('buildWikipediaArticlePreview', () => {
  it('bolds the article title before the Wikipedia suffix', () => {
    // Arrange
    const input = {
      articleTitle: 'Alan Turing',
      extract: 'English mathematician and computer scientist.',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/320px-Alan_Turing_Aged_16.jpg',
    };

    // Act
    const preview = buildWikipediaArticlePreview(input);

    // Assert
    expect(preview.kind).toBe('wikipedia-article');
    expect(preview.prefixText).toBe('');
    expect(preview.boldText).toBe('Alan Turing');
    expect(preview.suffixText).toBe(` ${WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY}`);
    expect(preview.logoUrl).toContain('wikipedia.svg');
    expect(preview.extract).toBe(input.extract);
    expect(preview.thumbnailUrl).toBe(input.thumbnailUrl);
  });
});
