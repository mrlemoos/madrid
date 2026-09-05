import type { JSX } from 'react';
import {
  WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY,
  type PlatformLinkPreview,
} from '@getmadrid/link-platform-preview';
import {
  HoverCard,
  HoverCardPortal,
  HoverCardPositioner,
  HoverCardPopup,
  HoverCardTrigger,
} from '@getmadrid/design/hover-card';
import { cn } from '@getmadrid/design/utils';
import { safeOgImageSrcForPreview } from '../../lib/og-image-url';
import { useNotePdfDocContext } from './note-pdf-extension';

export type PlatformLinkPreviewAttrs = {
  platformKind: string;
  platformLogo: string;
  platformBold: string;
  platformPrefix: string;
  platformSuffix: string;
  platformDisplayText: string;
  platformThumbnailUrl: string;
  platformChannelName: string;
  platformChannelAvatarUrl: string;
  platformSubreddit: string;
  platformSubredditAvatarUrl: string;
  platformPostTitle: string;
  platformOp: string;
  platformUserAvatarUrl: string;
  platformExtract: string;
};

export function platformAttrsFromPreview(
  platform: PlatformLinkPreview,
): PlatformLinkPreviewAttrs {
  return {
    platformKind: platform.kind,
    platformLogo: platform.logoUrl,
    platformBold: platform.boldText,
    platformPrefix: platform.prefixText,
    platformSuffix: platform.suffixText,
    platformDisplayText: platform.displayText ?? '',
    platformThumbnailUrl: platform.thumbnailUrl ?? '',
    platformChannelName: platform.channelName ?? '',
    platformChannelAvatarUrl: platform.channelAvatarUrl ?? '',
    platformSubreddit: platform.subreddit ?? '',
    platformSubredditAvatarUrl: platform.subredditAvatarUrl ?? '',
    platformPostTitle: platform.postTitle ?? '',
    platformOp: platform.op ?? '',
    platformUserAvatarUrl: platform.userAvatarUrl ?? '',
    platformExtract: platform.extract ?? '',
  };
}

export function platformPreviewFromAttrs(
  attrs: Record<string, unknown>,
): PlatformLinkPreview | null {
  const kind = stringifyAttr(attrs['platformKind']).trim();
  if (!kind) return null;
  const logoUrl = stringifyAttr(attrs['platformLogo']).trim();
  if (!logoUrl) return null;

  return {
    kind: kind as PlatformLinkPreview['kind'],
    logoUrl,
    boldText: stringifyAttr(attrs['platformBold']),
    prefixText: stringifyAttr(attrs['platformPrefix']),
    suffixText: stringifyAttr(attrs['platformSuffix']),
    displayText: stringifyAttr(attrs['platformDisplayText']) || undefined,
    thumbnailUrl: stringifyAttr(attrs['platformThumbnailUrl']) || undefined,
    channelName: stringifyAttr(attrs['platformChannelName']) || undefined,
    channelAvatarUrl:
      stringifyAttr(attrs['platformChannelAvatarUrl']) || undefined,
    subreddit: stringifyAttr(attrs['platformSubreddit']) || undefined,
    subredditAvatarUrl:
      stringifyAttr(attrs['platformSubredditAvatarUrl']) || undefined,
    postTitle: stringifyAttr(attrs['platformPostTitle']) || undefined,
    op: stringifyAttr(attrs['platformOp']) || undefined,
    userAvatarUrl: stringifyAttr(attrs['platformUserAvatarUrl']) || undefined,
    extract: stringifyAttr(attrs['platformExtract']) || undefined,
  };
}

function stringifyAttr(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function displayPlatformSuffix(
  platform: PlatformLinkPreview,
  translateUi?: (key: string) => string,
): string {
  if (platform.kind === 'wikipedia-article') {
    const translated =
      translateUi?.(WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY) ??
      WIKIPEDIA_ARTICLE_SUFFIX_I18N_KEY;
    return ` ${translated}`;
  }
  return platform.suffixText;
}

function PlatformLinkHoverDetails({
  platform,
  displayText,
}: {
  platform: PlatformLinkPreview;
  displayText?: string;
}): JSX.Element {
  const thumb = safeOgImageSrcForPreview(platform.thumbnailUrl ?? '');
  const channelAvatar = safeOgImageSrcForPreview(
    platform.channelAvatarUrl ?? '',
  );
  const subAvatar = safeOgImageSrcForPreview(platform.subredditAvatarUrl ?? '');
  const userAvatar = safeOgImageSrcForPreview(platform.userAvatarUrl ?? '');

  if (platform.kind === 'youtube-video') {
    return (
      <div className="flex flex-col">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="aspect-video w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="flex gap-3 p-3">
          {channelAvatar ? (
            <img
              src={channelAvatar}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {platform.channelName ?? ''}
            </p>
            {platform.boldText ? (
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                {platform.boldText}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (platform.kind === 'youtube-channel') {
    return (
      <div className="flex flex-col">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="h-28 w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="flex items-center gap-3 p-3">
          {channelAvatar ? (
            <img
              src={channelAvatar}
              alt=""
              className="size-11 shrink-0 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <p className="min-w-0 text-sm font-medium text-foreground">
            {platform.channelName ?? ''}
          </p>
        </div>
      </div>
    );
  }

  if (platform.kind === 'wikipedia-article') {
    return (
      <div className="flex flex-col">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="p-3">
          {platform.boldText ? (
            <p className="text-sm font-semibold leading-snug text-foreground">
              {platform.boldText}
            </p>
          ) : null}
          {platform.extract ? (
            <p className="mt-2 line-clamp-4 text-xs text-muted-foreground">
              {platform.extract}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (platform.kind === 'reddit-post') {
    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          {subAvatar ? (
            <img
              src={subAvatar}
              alt=""
              className="size-8 shrink-0 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {platform.subreddit ? (
            <span className="text-xs font-medium text-muted-foreground">
              r/{platform.subreddit}
            </span>
          ) : null}
        </div>
        {platform.postTitle ? (
          <p className="text-sm font-semibold leading-snug text-foreground">
            {platform.postTitle}
          </p>
        ) : null}
        <div className="flex items-center gap-2 border-t border-border/60 pt-2">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt=""
              className="size-8 shrink-0 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {platform.op ? (
            <span className="text-xs text-foreground">{platform.op}</span>
          ) : null}
        </div>
      </div>
    );
  }

  /* reddit-sub */
  return (
    <div className="flex items-start gap-3 p-3">
      {subAvatar ? (
        <img
          src={subAvatar}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        {platform.subreddit ? (
          <p className="text-sm font-medium text-foreground">
            r/{platform.subreddit}
          </p>
        ) : null}
        {displayText ? (
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {displayText}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PlatformLinkPreviewLabel({
  href,
  platform,
}: {
  href: string;
  platform: PlatformLinkPreview;
}): JSX.Element {
  const ctx = useNotePdfDocContext();
  const displayText = platform.displayText?.trim();
  const suffixText = displayPlatformSuffix(platform, ctx?.translateUi);

  const anchorClass = cn(
    'inline-flex min-w-0 max-w-full items-center gap-1.5 text-base font-normal text-foreground',
    'no-underline hover:no-underline',
  );

  return (
    <HoverCard>
      <HoverCardTrigger
        nativeButton={false}
        delay={220}
        closeDelay={140}
        render={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={anchorClass}
            data-platform-link-preview={platform.kind}
          >
            <img
              src={platform.logoUrl}
              alt=""
              width={16}
              height={16}
              className="size-4 shrink-0"
              loading="lazy"
              decoding="async"
            />
            <span className="min-w-0 break-words border-b border-muted-foreground/30">
              {displayText ? (
                displayText
              ) : (
                <>
                  {platform.prefixText ? (
                    <span className="font-normal">{platform.prefixText}</span>
                  ) : null}
                  {platform.boldText ? (
                    <strong className="font-semibold">
                      {platform.boldText}
                    </strong>
                  ) : null}
                  {suffixText ? (
                    <span className="font-normal">{suffixText}</span>
                  ) : null}
                </>
              )}
            </span>
          </a>
        }
      />
      <HoverCardPortal>
        <HoverCardPositioner
          side="top"
          sideOffset={10}
          align="start"
          collisionPadding={12}
        >
          <HoverCardPopup
            className="w-72 max-w-[min(20rem,calc(100vw-1.5rem))] p-0"
            role="region"
            aria-label="Link preview"
          >
            <PlatformLinkHoverDetails
              platform={platform}
              displayText={displayText}
            />
          </HoverCardPopup>
        </HoverCardPositioner>
      </HoverCardPortal>
    </HoverCard>
  );
}
