import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requireEntitledUserId = vi.fn();
const transcribeAudioWithXai = vi.fn();
const streamXaiChatCompletion = vi.fn();
const parseStudyNotesJson = vi.fn();
const fallbackStudyNotesFromTranscript = vi.fn();
const buildStudyNotesSystemPrompt = vi.fn(() => 'system');
const transcriptUserMessage = vi.fn(() => 'user');
const sanitizeAudioToNoteTextField = vi.fn((raw: string) => raw.trim());
const isAllowedAudioUploadMime = vi.fn(() => true);

vi.mock('server-only', () => ({}));
vi.mock('@/server/route-auth', () => ({ requireEntitledUserId }));
vi.mock('@/server/audio-upload.server', () => ({
  AUDIO_UPLOAD_MAX_BYTES: 100,
  isAllowedAudioUploadMime,
}));
vi.mock('@/server/xai-audio-note.server', () => ({
  buildStudyNotesSystemPrompt,
  fallbackStudyNotesFromTranscript,
  parseStudyNotesJson,
  sanitizeAudioToNoteTextField,
  streamXaiChatCompletion,
  transcribeAudioWithXai,
  transcriptUserMessage,
}));

const route = await import('./route');

const DONE = { title: 'Lecture', blocks: [] };

function post(form: FormData | null) {
  return {
    formData: () =>
      form ? Promise.resolve(form) : Promise.reject(new Error('not multipart')),
  } as unknown as Request;
}

function formWith(
  file: File | null,
  fields: Record<string, string> = {},
): FormData {
  const form = new FormData();
  if (file) {
    form.append('audio', file);
  }
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}

function wav(size = 10) {
  return new File([new Uint8Array(size)], 'capture.wav', { type: 'audio/wav' });
}

/** Reads the whole SSE body and splits it into `[event, data]` pairs. */
async function readEvents(response: Response) {
  const text = await response.text();
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const event = /event: (.+)/.exec(block)?.[1] ?? '';
      const data: unknown = JSON.parse(/data: (.+)/.exec(block)?.[1] ?? 'null');
      return [event, data] as const;
    });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.XAI_API_KEY = 'xai-key';
  requireEntitledUserId.mockResolvedValue({ userId: 'user-1' });
  isAllowedAudioUploadMime.mockReturnValue(true);
  sanitizeAudioToNoteTextField.mockImplementation((raw: string) => raw.trim());
  transcribeAudioWithXai.mockResolvedValue({
    text: 'hello there',
    duration: 12,
  });
  streamXaiChatCompletion.mockResolvedValue('{"title":"Lecture"}');
  parseStudyNotesJson.mockReturnValue(DONE);
  fallbackStudyNotesFromTranscript.mockReturnValue({
    title: 'Recording',
    blocks: [],
  });
});

afterEach(() => {
  delete process.env.XAI_API_KEY;
});

describe('POST /api/audio-to-note', () => {
  it('keeps transcription behind the entitlement gate', async () => {
    // Arrange
    requireEntitledUserId.mockResolvedValue(
      Response.json({ error: 'Forbidden' }, { status: 403 }),
    );

    // Act
    const response = await route.POST(post(formWith(wav())));

    // Assert
    expect(response.status).toBe(403);
    expect(transcribeAudioWithXai).not.toHaveBeenCalled();
  });

  it('answers 503 when the server has no xAI key', async () => {
    // Arrange
    delete process.env.XAI_API_KEY;

    // Act
    const response = await route.POST(post(formWith(wav())));

    // Assert
    expect(response.status).toBe(503);
  });

  it('rejects a body that is not multipart form data', async () => {
    // Arrange|Act
    const response = await route.POST(post(null));

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid form data',
    });
  });

  it('rejects a missing or empty recording', async () => {
    // Arrange|Act
    const missing = await route.POST(post(formWith(null)));
    const empty = await route.POST(
      post(formWith(new File([], 'x.wav', { type: 'audio/wav' }))),
    );

    // Assert
    expect(missing.status).toBe(400);
    expect(empty.status).toBe(400);
  });

  it('answers 413 for a recording over the limit', async () => {
    // Arrange|Act
    const response = await route.POST(post(formWith(wav(200))));

    // Assert
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: 'Audio file too large',
    });
  });

  it('rejects an audio type xAI cannot read', async () => {
    // Arrange
    isAllowedAudioUploadMime.mockReturnValue(false);

    // Act
    const response = await route.POST(
      post(
        formWith(
          new File([new Uint8Array(4)], 'x.webm', { type: 'audio/webm' }),
        ),
      ),
    );

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Unsupported audio type: audio/webm',
    });
  });

  it('streams the transcript, then the notes, as server-sent events', async () => {
    // Arrange
    streamXaiChatCompletion.mockImplementation(
      async (options: { onDelta: (chunk: string) => void }) => {
        options.onDelta('# Lect');
        options.onDelta('ure');
        return '{"title":"Lecture"}';
      },
    );

    // Act
    const response = await route.POST(post(formWith(wav())));

    // Assert
    expect(response.headers.get('Content-Type')).toBe(
      'text/event-stream; charset=utf-8',
    );
    expect(await readEvents(response)).toEqual([
      ['transcript', { text: 'hello there', duration: 12 }],
      ['notes_delta', { text: '# Lect' }],
      ['notes_delta', { text: 'ure' }],
      ['notes_done', DONE],
    ]);
  });

  it('passes the sanitised locale and course through to the prompt', async () => {
    // Arrange|Act
    await route.POST(
      post(
        formWith(wav(), { locale: '  en-GB  ', courseName: ' Cartography ' }),
      ),
    );

    // Assert
    expect(transcribeAudioWithXai).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en-GB', mime: 'audio/wav' }),
    );
    expect(buildStudyNotesSystemPrompt).toHaveBeenCalledWith('Cartography');
  });

  it('omits fields that sanitise to nothing', async () => {
    // Arrange|Act
    await route.POST(post(formWith(wav(), { locale: '   ' })));

    // Assert
    expect(transcribeAudioWithXai).toHaveBeenCalledWith(
      expect.objectContaining({ language: undefined }),
    );
    expect(buildStudyNotesSystemPrompt).toHaveBeenCalledWith(undefined);
  });

  it('falls back to the transcript when the model returns unusable notes', async () => {
    // Arrange
    parseStudyNotesJson.mockImplementation(() => {
      throw new Error('not JSON');
    });

    // Act
    const events = await readEvents(await route.POST(post(formWith(wav()))));

    // Assert — the reader still gets their recording written up
    expect(events.map(([event]) => event)).toEqual([
      'transcript',
      'notes_parse_fallback',
      'notes_done',
    ]);
    expect(fallbackStudyNotesFromTranscript).toHaveBeenCalledWith(
      'hello there',
    );
  });

  it('sends a failed transcription down the stream, not as a status code', async () => {
    // Arrange
    transcribeAudioWithXai.mockRejectedValue(new Error('xAI unavailable'));

    // Act
    const response = await route.POST(post(formWith(wav())));

    // Assert — the stream has already begun by the time this can fail
    expect(response.status).toBe(200);
    expect(await readEvents(response)).toEqual([
      ['error', { message: 'xAI unavailable' }],
    ]);
  });
});
