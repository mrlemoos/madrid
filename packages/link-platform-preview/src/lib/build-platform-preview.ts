import {
  SVGL_REDDIT_LOGO_URL,
  SVGL_YOUTUBE_LOGO_URL,
  WIKIPEDIA_LOGO_URL,
} from './logos';
import type { PlatformLinkPreview } from './platform-preview-types';

/** British English i18n key for the Wikipedia article suffix. */
export const WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY = 'on Wikipedia';

export function buildRedditPostPreview(input: {
  op: string;
  postTitle: string;
  subreddit: string;
  subredditAvatarUrl?: string;
  userAvatarUrl?: string;
}): PlatformLinkPreview {
  const op = input.op.startsWith('u/') ? input.op : `u/${input.op}`;
  return {
    kind: 'reddit-post',
    logoUrl: SVGL_REDDIT_LOGO_URL,
    prefixText: `${op} `,
    boldText: input.postTitle,
    suffixText: ` in r/${input.subreddit}`,
    subreddit: input.subreddit,
    subredditAvatarUrl: input.subredditAvatarUrl,
    postTitle: input.postTitle,
    op,
    userAvatarUrl: input.userAvatarUrl,
  };
}

export function buildRedditSubPreview(
  displayUrl: string,
  input: { subreddit?: string; subredditAvatarUrl?: string } = {},
): PlatformLinkPreview {
  return {
    kind: 'reddit-sub',
    logoUrl: SVGL_REDDIT_LOGO_URL,
    prefixText: '',
    boldText: '',
    suffixText: '',
    displayText: displayUrl,
    subreddit: input.subreddit,
    subredditAvatarUrl: input.subredditAvatarUrl,
  };
}

export function buildYoutubeVideoPreview(input: {
  videoTitle: string;
  channelName: string;
  thumbnailUrl?: string;
  channelAvatarUrl?: string;
}): PlatformLinkPreview {
  return {
    kind: 'youtube-video',
    logoUrl: SVGL_YOUTUBE_LOGO_URL,
    prefixText: '',
    boldText: input.videoTitle,
    suffixText: ` by ${input.channelName}`,
    thumbnailUrl: input.thumbnailUrl,
    channelName: input.channelName,
    channelAvatarUrl: input.channelAvatarUrl,
  };
}

export function buildYoutubeChannelPreview(
  channelName: string,
  input: { thumbnailUrl?: string; channelAvatarUrl?: string } = {},
): PlatformLinkPreview {
  return {
    kind: 'youtube-channel',
    logoUrl: SVGL_YOUTUBE_LOGO_URL,
    prefixText: `${channelName} `,
    boldText: '',
    suffixText: 'YouTube Channel',
    thumbnailUrl: input.thumbnailUrl,
    channelName,
    channelAvatarUrl: input.channelAvatarUrl,
  };
}

/** Strip a trailing " - YouTube" from channel OG titles. */
export function stripYoutubeChannelTitleSuffix(title: string): string {
  return title.replace(/\s*[-–|]\s*YouTube\s*$/i, '').trim();
}

export function buildWikipediaArticlePreview(input: {
  articleTitle: string;
  extract?: string;
  thumbnailUrl?: string;
}): PlatformLinkPreview {
  return {
    kind: 'wikipedia-article',
    logoUrl: WIKIPEDIA_LOGO_URL,
    prefixText: '',
    boldText: input.articleTitle,
    suffixText: ` ${WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY}`,
    articleTitle: input.articleTitle,
    extract: input.extract,
    thumbnailUrl: input.thumbnailUrl,
  };
}
