import { requireEntitledUserId } from '@/server/route-auth';
import {
  AUDIO_UPLOAD_MAX_BYTES,
  isAllowedAudioUploadMime,
} from '@/server/audio-upload.server';
import {
  buildStudyNotesSystemPrompt,
  fallbackStudyNotesFromTranscript,
  parseStudyNotesJson,
  sanitizeAudioToNoteTextField,
  streamXaiChatCompletion,
  transcribeAudioWithXai,
  transcriptUserMessage,
  type StudyNotesResult,
} from '@/server/xai-audio-note.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function optionalField(
  form: FormData,
  name: string,
  maxChars: number,
): string | undefined {
  const raw = form.get(name);
  if (typeof raw !== 'string') {
    return undefined;
  }
  const cleaned = sanitizeAudioToNoteTextField(raw, { maxChars });
  return cleaned && cleaned.length > 0 ? cleaned : undefined;
}

/**
 * POST /api/audio-to-note — transcribe an uploaded recording (xAI) and stream
 * study notes back as Server-Sent Events. Entitled users only.
 */
export async function POST(request: Request): Promise<Response> {
  const gate = await requireEntitledUserId();
  if (gate instanceof Response) {
    return gate;
  }

  if (!process.env.XAI_API_KEY?.trim()) {
    return Response.json(
      { error: 'Audio-to-note is not configured on the server.' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('audio');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { error: 'Missing audio file (field: audio)' },
      { status: 400 },
    );
  }
  if (file.size > AUDIO_UPLOAD_MAX_BYTES) {
    return Response.json({ error: 'Audio file too large' }, { status: 413 });
  }
  if (!isAllowedAudioUploadMime(file.type)) {
    return Response.json(
      { error: `Unsupported audio type: ${file.type || 'unknown'}` },
      { status: 400 },
    );
  }

  const locale = optionalField(form, 'locale', 32);
  const courseName = optionalField(form, 'courseName', 200);
  const audio = Buffer.from(await file.arrayBuffer());
  const filename = file.name || 'recording.webm';
  const mime = file.type;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown): void => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        const { text: transcript, duration } = await transcribeAudioWithXai({
          audio,
          filename,
          mime,
          language: locale,
        });
        send('transcript', { text: transcript, duration });

        const system = buildStudyNotesSystemPrompt(courseName);
        const user = transcriptUserMessage(transcript);
        let notesResult: StudyNotesResult;
        try {
          const raw = await streamXaiChatCompletion({
            system,
            user,
            onDelta: (chunk) => {
              send('notes_delta', { text: chunk });
            },
          });
          notesResult = parseStudyNotesJson(raw);
        } catch {
          notesResult = fallbackStudyNotesFromTranscript(transcript);
          send('notes_parse_fallback', { ok: true });
        }
        send('notes_done', notesResult);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Audio-to-note failed';
        send('error', { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
