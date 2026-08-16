import { describe, expect, it } from 'vitest';
import type { PlatformLinkPreview } from '@nota/link-platform-preview';
import {
  platformAttrsFromPreview,
  platformPreviewFromAttrs,
} from './platform-link-preview-label';

describe('platformAttrsFromPreview / platformPreviewFromAttrs', () => {
  it('round-trips a youtube-video preview', () => {
    // Arrange
    const platform: PlatformLinkPreview = {
      kind: 'youtube-video',
      logoUrl: 'https://cdn.example.com/yt.svg',
      boldText: 'Video title',
      prefixText: '',
      suffixText: '',
      displayText: 'Watch',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      channelName: 'Channel',
      channelAvatarUrl: 'https://cdn.example.com/av.jpg',
    };

    // Act
    const attrs = platformAttrsFromPreview(platform);
    const back = platformPreviewFromAttrs(attrs);

    // Assert
    expect(attrs.platformKind).toBe('youtube-video');
    expect(attrs.platformLogo).toBe(platform.logoUrl);
    expect(back?.kind).toBe('youtube-video');
    expect(back?.channelName).toBe('Channel');
    expect(back?.thumbnailUrl).toBe(platform.thumbnailUrl);
  });

  it('returns null when kind or logo is missing', () => {
    // Arrange
    const noKind = { platformKind: '', platformLogo: 'https://x' };
    const noLogo = { platformKind: 'reddit-post', platformLogo: '' };

    // Act
    const a = platformPreviewFromAttrs(noKind);
    const b = platformPreviewFromAttrs(noLogo);

    // Assert
    expect(a).toBeNull();
    expect(b).toBeNull();
  });

  it('maps wikipedia extract through attrs', () => {
    // Arrange
    const platform: PlatformLinkPreview = {
      kind: 'wikipedia-article',
      logoUrl: 'https://cdn.example.com/wiki.svg',
      boldText: 'Article',
      prefixText: '',
      suffixText: '',
      extract: 'A short summary.',
    };

    // Act
    const attrs = platformAttrsFromPreview(platform);
    const back = platformPreviewFromAttrs(attrs);

    // Assert
    expect(attrs.platformExtract).toBe('A short summary.');
    expect(back?.extract).toBe('A short summary.');
  });
});
