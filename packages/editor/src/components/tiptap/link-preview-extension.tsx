import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { useEffect, useRef, useState, type JSX } from 'react';
import { Button } from '@nota/design/button';
import { Spinner } from '@nota/design/spinner';
import { cn } from '@nota/design/utils';
import { safeOgImageSrcForPreview } from '../../lib/og-image-url';
import { revertLinkPreviewToParagraph } from './link-preview-scan';
import { useNotePdfDocContext } from './note-pdf-extension';
import {
  PlatformLinkPreviewLabel,
  platformAttrsFromPreview,
  platformPreviewFromAttrs,
} from './platform-link-preview-label';

function stringifyPreviewAttr(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return '';
}

function linkPreviewHasPersistedMeta(node: {
  attrs: Record<string, unknown>;
}): boolean {
  if (platformPreviewFromAttrs(node.attrs)) return true;
  return Boolean(
    stringifyPreviewAttr(node.attrs['title']).trim() ||
      stringifyPreviewAttr(node.attrs['description']).trim() ||
      stringifyPreviewAttr(node.attrs['image']).trim(),
  );
}

const platformAttrDefaults = {
  platformKind: '',
  platformLogo: '',
  platformBold: '',
  platformPrefix: '',
  platformSuffix: '',
  platformDisplayText: '',
  platformThumbnailUrl: '',
  platformChannelName: '',
  platformChannelAvatarUrl: '',
  platformSubreddit: '',
  platformSubredditAvatarUrl: '',
  platformPostTitle: '',
  platformOp: '',
  platformUserAvatarUrl: '',
  platformExtract: '',
};

function LinkPreviewNodeView(props: NodeViewProps): JSX.Element {
  const ctx = useNotePdfDocContext();
  const href = (props.node.attrs['href'] as string) || '';
  const linkTextAttr = (props.node.attrs['linkText'] as string) || '';
  const titleAttr = (props.node.attrs['title'] as string) || '';
  const descriptionAttr = (props.node.attrs['description'] as string) || '';
  const imageAttr = (props.node.attrs['image'] as string) || '';
  const safeImageSrc = safeOgImageSrcForPreview(imageAttr);

  const platform = platformPreviewFromAttrs(props.node.attrs);
  const hasOgMeta = Boolean(titleAttr || descriptionAttr || imageAttr);
  const hasMeta = Boolean(platform || hasOgMeta);
  const [loading, setLoading] = useState(() => Boolean(href) && !hasMeta);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const updateAttributesRef = useRef(props.updateAttributes);
  updateAttributesRef.current = props.updateAttributes;
  const editorRef = useRef(props.editor);
  editorRef.current = props.editor;
  const getPosRef = useRef(props.getPos);
  getPosRef.current = props.getPos;

  useEffect(() => {
    if (!href || !ctx?.fetchOgPreview) return;
    const fetchOgPreview = ctx.fetchOgPreview;
    let cancelled = false;
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchOgPreview(href);
        if (cancelled) return;

        const pos = getPosRef.current();
        if (typeof pos !== 'number') return;
        const current = editorRef.current.state.doc.nodeAt(pos);
        if (!current || current.type.name !== 'linkPreview') return;

        if (data.platform) {
          updateAttributesRef.current({
            ...platformAttrsFromPreview(data.platform),
            title: '',
            description: '',
            image: '',
          });
          return;
        }

        const title = (data.title ?? '').trim();
        const desc = (data.description ?? '').trim();
        const image = (data.image ?? '').trim();

        if (!title && !desc && !image) {
          if (!linkPreviewHasPersistedMeta(current)) {
            revertLinkPreviewToParagraph(editorRef.current, getPosRef.current);
          }
          return;
        }
        updateAttributesRef.current({
          ...platformAttrDefaults,
          title: data.title ?? '',
          description: data.description ?? '',
          image: data.image ?? '',
        });
      } catch (e) {
        if (cancelled) return;
        const pos = getPosRef.current();
        if (typeof pos !== 'number') return;
        const current = editorRef.current.state.doc.nodeAt(pos);
        if (!current || current.type.name !== 'linkPreview') return;
        if (!linkPreviewHasPersistedMeta(current)) {
          revertLinkPreviewToParagraph(editorRef.current, getPosRef.current);
        } else {
          setError(e instanceof Error ? e.message : 'Preview failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [href, refreshNonce, ctx]);

  const displayTitle = titleAttr || href;
  const displayLinkLabel = linkTextAttr.trim() || href;

  const selectionRing =
    props.selected &&
    'rounded-sm ring-2 ring-ring/40 ring-offset-2 ring-offset-background';

  if (loading && !hasMeta) {
    return (
      <NodeViewWrapper
        as="div"
        className={cn(
          'link-preview-loading my-3 flex min-w-0 items-center gap-2',
          selectionRing,
        )}
        data-drag-handle
        aria-busy="true"
        aria-label="Loading link preview"
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tiptap-link min-w-0 flex-1 break-words text-base"
        >
          {displayLinkLabel}
        </a>
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center"
          aria-hidden
        >
          <Spinner size="sm" />
        </span>
      </NodeViewWrapper>
    );
  }

  if (platform) {
    return (
      <NodeViewWrapper
        as="div"
        className={cn('link-preview-platform my-3 min-w-0', selectionRing)}
        data-drag-handle
      >
        <PlatformLinkPreviewLabel href={href} platform={platform} />
        {error ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        'link-preview-block my-4 overflow-hidden rounded-md border border-border/60 bg-muted/20',
        selectionRing,
      )}
      data-drag-handle
    >
      <div className="flex flex-col gap-0 sm:flex-row">
        {safeImageSrc ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 border-b border-border/40 sm:w-36 sm:border-b-0 sm:border-r"
          >
            <img
              src={safeImageSrc}
              alt=""
              className="h-32 w-full object-cover sm:h-full sm:min-h-[7rem]"
              loading="lazy"
            />
          </a>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="tiptap-link min-w-0 flex-1 break-words text-sm font-medium text-foreground"
            >
              {displayTitle}
            </a>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                disabled={loading}
                onClick={() => {
                  setRefreshNonce((n) => n + 1);
                }}
              >
                Refresh
              </Button>
            </div>
          </div>
          {descriptionAttr ? (
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {descriptionAttr}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const LinkPreview = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      href: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-href') ?? '',
        renderHTML: (attrs) => (attrs.href ? { 'data-href': attrs.href } : {}),
      },
      linkText: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-link-text') ?? '',
        renderHTML: (attrs) =>
          attrs.linkText ? { 'data-link-text': attrs.linkText } : {},
      },
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') ?? '',
        renderHTML: (attrs) =>
          attrs.title ? { 'data-title': attrs.title } : {},
      },
      description: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-description') ?? '',
        renderHTML: (attrs) =>
          attrs.description ? { 'data-description': attrs.description } : {},
      },
      image: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-image') ?? '',
        renderHTML: (attrs) =>
          attrs.image ? { 'data-image': attrs.image } : {},
      },
      platformKind: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-kind') ?? '',
        renderHTML: (attrs) =>
          attrs.platformKind
            ? { 'data-platform-kind': attrs.platformKind }
            : {},
      },
      platformLogo: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-logo') ?? '',
        renderHTML: (attrs) =>
          attrs.platformLogo
            ? { 'data-platform-logo': attrs.platformLogo }
            : {},
      },
      platformBold: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-bold') ?? '',
        renderHTML: (attrs) =>
          attrs.platformBold
            ? { 'data-platform-bold': attrs.platformBold }
            : {},
      },
      platformPrefix: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-prefix') ?? '',
        renderHTML: (attrs) =>
          attrs.platformPrefix
            ? { 'data-platform-prefix': attrs.platformPrefix }
            : {},
      },
      platformSuffix: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-suffix') ?? '',
        renderHTML: (attrs) =>
          attrs.platformSuffix
            ? { 'data-platform-suffix': attrs.platformSuffix }
            : {},
      },
      platformDisplayText: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-display') ?? '',
        renderHTML: (attrs) =>
          attrs.platformDisplayText
            ? { 'data-platform-display': attrs.platformDisplayText }
            : {},
      },
      platformThumbnailUrl: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-thumbnail') ?? '',
        renderHTML: (attrs) =>
          attrs.platformThumbnailUrl
            ? { 'data-platform-thumbnail': attrs.platformThumbnailUrl }
            : {},
      },
      platformChannelName: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-channel-name') ?? '',
        renderHTML: (attrs) =>
          attrs.platformChannelName
            ? { 'data-platform-channel-name': attrs.platformChannelName }
            : {},
      },
      platformChannelAvatarUrl: {
        default: '',
        parseHTML: (el) =>
          el.getAttribute('data-platform-channel-avatar') ?? '',
        renderHTML: (attrs) =>
          attrs.platformChannelAvatarUrl
            ? {
                'data-platform-channel-avatar': attrs.platformChannelAvatarUrl,
              }
            : {},
      },
      platformSubreddit: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-subreddit') ?? '',
        renderHTML: (attrs) =>
          attrs.platformSubreddit
            ? { 'data-platform-subreddit': attrs.platformSubreddit }
            : {},
      },
      platformSubredditAvatarUrl: {
        default: '',
        parseHTML: (el) =>
          el.getAttribute('data-platform-subreddit-avatar') ?? '',
        renderHTML: (attrs) =>
          attrs.platformSubredditAvatarUrl
            ? {
                'data-platform-subreddit-avatar':
                  attrs.platformSubredditAvatarUrl,
              }
            : {},
      },
      platformPostTitle: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-post-title') ?? '',
        renderHTML: (attrs) =>
          attrs.platformPostTitle
            ? { 'data-platform-post-title': attrs.platformPostTitle }
            : {},
      },
      platformOp: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-op') ?? '',
        renderHTML: (attrs) =>
          attrs.platformOp ? { 'data-platform-op': attrs.platformOp } : {},
      },
      platformUserAvatarUrl: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-user-avatar') ?? '',
        renderHTML: (attrs) =>
          attrs.platformUserAvatarUrl
            ? { 'data-platform-user-avatar': attrs.platformUserAvatarUrl }
            : {},
      },
      platformExtract: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-platform-extract') ?? '',
        renderHTML: (attrs) =>
          attrs.platformExtract
            ? { 'data-platform-extract': attrs.platformExtract }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-link-preview]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-link-preview': '' }, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewNodeView);
  },
});
