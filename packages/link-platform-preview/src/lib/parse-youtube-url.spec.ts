import { describe, expect, it } from 'vitest';
import { parseYoutubeUrl } from './parse-youtube-url';

describe('parseYoutubeUrl', () => {
  it('detects watch URLs', () => {
    // Arrange
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // Act
    const parsed = parseYoutubeUrl(url);

    // Assert
    expect(parsed).toEqual({ kind: 'video', videoId: 'dQw4w9WgXcQ' });
  });

  it('detects youtu.be links', () => {
    // Arrange
    const url = 'https://youtu.be/dQw4w9WgXcQ';

    // Act
    const parsed = parseYoutubeUrl(url);

    // Assert
    expect(parsed).toEqual({ kind: 'video', videoId: 'dQw4w9WgXcQ' });
  });

  it('detects channel handles', () => {
    // Arrange
    const url = 'https://www.youtube.com/@SomeChannel/playlists';

    // Act
    const parsed = parseYoutubeUrl(url);

    // Assert
    expect(parsed).toEqual({ kind: 'channel' });
  });

  it('detects playlist URLs as channel-style', () => {
    // Arrange
    const url = 'https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMH';

    // Act
    const parsed = parseYoutubeUrl(url);

    // Assert
    expect(parsed).toEqual({ kind: 'channel' });
  });
});
