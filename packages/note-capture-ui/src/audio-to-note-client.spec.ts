import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ensureBlobForXaiStt = vi.fn();
const filenameForSttUpload = vi.fn(() => 'capture.wav');

vi.mock('./audio-to-xai-stt-format', () => ({
  ensureBlobForXaiStt,
  filenameForSttUpload,
}));

const { postAudioToNoteStream } = await import('./audio-to-note-client');

const DONE = { title: 'Lecture', blocks: [] };

/** A `text/event-stream` body split into arbitrary network chunks. */
function sseResponse(chunks: string[], init: { status?: number } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    body: {
      getReader: () => ({
        read: () =>
          Promise.resolve(
            i < chunks.length
              ? { done: false, value: encoder.encode(chunks[i++]) }
              : { done: true, value: undefined },
          ),
      }),
    },
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

function event(name: string, data: unknown): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

beforeEach(() => {
  vi.clearAllMocks();
  ensureBlobForXaiStt.mockImplementation((blob: Blob) => Promise.resolve(blob));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postAudioToNoteStream', () => {
  it('posts the transcoded audio to the same-origin route', async () => {
    // Arrange
    const transcoded = new Blob(['pcm'], { type: 'audio/wav' });
    ensureBlobForXaiStt.mockResolvedValue(transcoded);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(sseResponse([event('notes_done', DONE)]));
    vi.stubGlobal('fetch', fetchMock);

    // Act
    await postAudioToNoteStream(new Blob(['webm'], { type: 'audio/webm' }), {
      locale: 'en-GB',
      courseName: 'Cartography',
    });

    // Assert — xAI STT only accepts WAV/MP3, so the raw recording is never sent
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/audio-to-note');
    expect(init.method).toBe('POST');
    const form = init.body as FormData;
    const sent = form.get('audio') as File;
    expect(sent.name).toBe('capture.wav');
    expect(sent.type).toBe('audio/wav');
    expect(ensureBlobForXaiStt).toHaveBeenCalledOnce();
    expect(filenameForSttUpload).toHaveBeenCalledWith(transcoded);
    expect(form.get('locale')).toBe('en-GB');
    expect(form.get('courseName')).toBe('Cartography');
  });

  it('omits the optional fields when the caller gives none', async () => {
    // Arrange
    const fetchMock = vi
      .fn()
      .mockResolvedValue(sseResponse([event('notes_done', DONE)]));
    vi.stubGlobal('fetch', fetchMock);

    // Act
    await postAudioToNoteStream(new Blob(['pcm']));

    // Assert
    const form = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      .body as FormData;
    expect(form.get('locale')).toBeNull();
    expect(form.get('courseName')).toBeNull();
  });

  it('reports the result from notes_done', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(sseResponse([event('notes_done', DONE)])),
    );

    // Act|Assert
    await expect(postAudioToNoteStream(new Blob(['pcm']))).resolves.toEqual(
      DONE,
    );
  });

  it('streams each event to the caller in order', async () => {
    // Arrange
    const onEvent = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            event('transcript', { text: 'hello', duration: 1 }),
            event('notes_delta', { text: '# Lecture' }),
            event('notes_parse_fallback', { ok: true }),
            event('notes_done', DONE),
          ]),
        ),
    );

    // Act
    await postAudioToNoteStream(new Blob(['pcm']), { onEvent });

    // Assert
    expect(
      onEvent.mock.calls.map(([e]) => (e as { event: string }).event),
    ).toEqual([
      'transcript',
      'notes_delta',
      'notes_parse_fallback',
      'notes_done',
    ]);
  });

  it('reassembles an event split across network chunks', async () => {
    // Arrange
    const whole = event('notes_done', DONE);
    const cut = Math.floor(whole.length / 2);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([whole.slice(0, cut), whole.slice(cut)]),
        ),
    );

    // Act|Assert
    await expect(postAudioToNoteStream(new Blob(['pcm']))).resolves.toEqual(
      DONE,
    );
  });

  it('ignores blocks it does not understand', async () => {
    // Arrange
    const onEvent = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            ': keep-alive\n\n',
            event('something_else', {}),
            event('notes_done', DONE),
          ]),
        ),
    );

    // Act
    await postAudioToNoteStream(new Blob(['pcm']), { onEvent });

    // Assert
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it('raises a server-sent error', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([event('error', { message: 'transcription failed' })]),
        ),
    );

    // Act|Assert
    await expect(postAudioToNoteStream(new Blob(['pcm']))).rejects.toThrow(
      'transcription failed',
    );
  });

  it('distinguishes a signed-out caller from one without Madrid Pro', async () => {
    // Arrange|Act|Assert
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(sseResponse([], { status: 401 })),
    );
    await expect(postAudioToNoteStream(new Blob(['pcm']))).rejects.toThrow(
      'Unauthorized',
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(sseResponse([], { status: 403 })),
    );
    await expect(postAudioToNoteStream(new Blob(['pcm']))).rejects.toThrow(
      'Madrid Pro required',
    );
  });

  it('surfaces the server body on any other failure', async () => {
    // Arrange
    const failure = {
      ok: false,
      status: 500,
      body: null,
      text: () => Promise.resolve('upstream is down'),
    } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(failure));

    // Act|Assert
    await expect(postAudioToNoteStream(new Blob(['pcm']))).rejects.toThrow(
      'upstream is down',
    );
  });

  it('fails when the stream ends before the notes arrive', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([event('transcript', { text: 'hi', duration: 1 })]),
        ),
    );

    // Act|Assert — a truncated stream must not look like an empty note
    await expect(postAudioToNoteStream(new Blob(['pcm']))).rejects.toThrow(
      'Stream ended without notes_done',
    );
  });
});
