import { ImageResponse } from 'next/og';

import {
  buildSharedNoteMeta,
  SHARED_NOTE_UNAVAILABLE_META,
} from '@nota/note-share-og/meta';

import { requireServiceSupabase } from '@/server/supabase-service.server';

export const alt = 'Shared note on Nota';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

interface OpenGraphImageProps {
  params: Promise<{ token: string }>;
}

/** Bucket holding every note attachment, PDFs and images alike. */
const ATTACHMENT_BUCKET = 'note-pdfs';

interface SharedNoteCard {
  title: string;
  description?: string;
  /** `data:` URI of the note's banner image, when it has one. */
  bannerDataUri?: string;
}

/**
 * Reads the shared note with the service role rather than the anon RPC.
 *
 * The banner lives in a private bucket, so there is no URL an unauthenticated
 * crawler could fetch. Resolving and inlining the bytes here keeps the token as
 * the only secret: no signed URL leaves the server, and no public read path is
 * added to storage.
 */
async function loadSharedNoteCard(token: string): Promise<SharedNoteCard> {
  const supabase = requireServiceSupabase();
  const { data: note } = await supabase
    .from('notes')
    .select('title, content, banner_attachment_id')
    .eq('share_token', token)
    .maybeSingle<{
      title: string;
      content: unknown;
      banner_attachment_id: string | null;
    }>();

  const meta = buildSharedNoteMeta(note ?? null);
  if (!note?.banner_attachment_id) {
    return meta;
  }

  const { data: attachment } = await supabase
    .from('note_attachments')
    .select('storage_path, content_type')
    .eq('id', note.banner_attachment_id)
    .maybeSingle<{ storage_path: string; content_type: string }>();
  if (!attachment) {
    return meta;
  }

  const { data: file } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .download(attachment.storage_path);
  if (!file) {
    return meta;
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  return {
    ...meta,
    bannerDataUri: `data:${attachment.content_type};base64,${base64}`,
  };
}

/**
 * Link-preview card for `/s/<token>`: the note's banner behind a scrim, with the
 * title and excerpt over it. Falls back to the plain brand card when the note has
 * no banner, is unknown, or cannot be read.
 */
export default async function Image({
  params,
}: OpenGraphImageProps): Promise<ImageResponse> {
  const { token } = await params;

  let card: SharedNoteCard;
  try {
    card = token ? await loadSharedNoteCard(token) : buildSharedNoteMeta(null);
  } catch {
    // Missing service-role env or a Supabase blip degrades to the brand card
    // rather than serving a broken image to the crawler.
    card = buildSharedNoteMeta(null);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
          padding: 72,
          backgroundColor: '#0b0b0c',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {card.bannerDataUri ? (
          <>
            <img
              src={card.bannerDataUri}
              alt=""
              width={size.width}
              height={size.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Scrim: the title has to stay readable over any banner. */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(to bottom, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.85) 100%)',
              }}
            />
          </>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Eyebrow is the brand mark; skip it when the fallback card already
              uses "Nota" as its title. */}
          {card.title === SHARED_NOTE_UNAVAILABLE_META.title ? null : (
            <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 20 }}>
              Nota
            </div>
          )}
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.1 }}>
            {card.title}
          </div>
          {card.description ? (
            <div
              style={{
                fontSize: 30,
                opacity: 0.82,
                marginTop: 24,
                lineHeight: 1.35,
              }}
            >
              {card.description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
