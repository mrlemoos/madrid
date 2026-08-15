import { NextResponse } from 'next/server';

import { requireServiceSupabase } from '@/server/supabase-service.server';

/** Bucket holding every note attachment, PDFs and images alike. */
const ATTACHMENT_BUCKET = 'note-pdfs';

/** Matches the editor's default signed-URL lifetime. */
const SIGNED_URL_TTL_SEC = 3600;

interface RouteParams {
  params: Promise<{ token: string; attachmentId: string }>;
}

/**
 * Serves one attachment of a link-shared note to an unauthenticated viewer.
 *
 * The bucket stays private and anon gets no storage policy: this route re-checks,
 * with the service role, that the requested attachment really belongs to the note
 * behind this token, then redirects to a short-lived signed URL. Both the token
 * and the attachment id are needed, so holding a link grants exactly that note's
 * files and nothing else.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { token, attachmentId } = await params;
  if (!token || !attachmentId) {
    return new NextResponse('Not found', { status: 404 });
  }

  let signedUrl: string;
  try {
    const supabase = requireServiceSupabase();
    // One query, joined on the share token: an attachment id from another note
    // returns no row, so it cannot be used to read across notes.
    const { data: attachment } = await supabase
      .from('note_attachments')
      .select('storage_path, notes!inner(share_token)')
      .eq('id', attachmentId)
      .eq('notes.share_token', token)
      .maybeSingle<{ storage_path: string }>();
    if (!attachment) {
      return new NextResponse('Not found', { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SEC);
    if (error || !data) {
      return new NextResponse('Not found', { status: 404 });
    }
    signedUrl = data.signedUrl;
  } catch {
    // Missing service-role env or a Supabase blip: the node renders its own
    // "could not load" state rather than a broken image.
    return new NextResponse('Not available', { status: 503 });
  }

  return NextResponse.redirect(signedUrl, {
    // Short private cache: long enough to spare a round trip per image render,
    // far short of the signed URL's own lifetime.
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
