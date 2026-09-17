import { NextResponse } from 'next/server';

import { requireServiceSupabase } from '@/server/supabase-service.server';

/** Bucket holding every note attachment, PDFs and images alike. */
const ATTACHMENT_BUCKET = 'note-pdfs';

interface RouteParams {
  params: Promise<{ token: string; attachmentId: string }>;
}

/**
 * Serves one attachment of a link-shared note to an unauthenticated viewer.
 *
 * The bucket stays private and anon gets no storage policy: this route re-checks,
 * with the service role, that the requested attachment really belongs to the note
 * behind this token, then streams the bytes from the same origin. Both the token
 * and the attachment id are needed, so holding a link grants exactly that note's
 * files and nothing else. Streaming avoids a cross-origin redirect that iOS
 * Safari cannot always hand to an embedded PDF viewer.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { token, attachmentId } = await params;
  if (!token || !attachmentId) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const supabase = requireServiceSupabase();
    // One query, joined on the share token: an attachment id from another note
    // returns no row, so it cannot be used to read across notes.
    const { data: attachment } = await supabase
      .from('note_attachments')
      .select(
        'storage_path, content_type, notes!note_attachments_note_id_fkey!inner(share_token)',
      )
      .eq('id', attachmentId)
      .eq('notes.share_token', token)
      .maybeSingle<{ storage_path: string; content_type: string }>();
    if (!attachment) {
      return new NextResponse('Not found', { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .download(attachment.storage_path);
    if (error || !data) {
      return new NextResponse('Not found', { status: 404 });
    }

    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'Content-Type': attachment.content_type,
      },
    });
  } catch {
    // Missing service-role env or a Supabase blip: the node renders its own
    // "could not load" state rather than a broken image.
    return new NextResponse('Not available', { status: 503 });
  }
}
