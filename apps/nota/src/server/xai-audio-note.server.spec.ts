import { describe, expect, test } from 'vitest';
import {
  buildStudyNotesSystemPrompt,
  fallbackStudyNotesFromTranscript,
  parseStudyNotesJson,
  sanitizeAudioToNoteTextField,
  studyNotesResultSchema,
  transcriptUserMessage,
} from './xai-audio-note.server';

describe('parseStudyNotesJson', () => {
  test('parses strict JSON', () => {
    // Arrange
    const raw = `{"title":"Thermodynamics","blocks":[{"type":"heading","level":2,"text":"Overview"},{"type":"paragraph","text":"Heat is energy."}]}`;

    // Act
    const r = parseStudyNotesJson(raw);

    // Assert
    expect(r.title).toBe('Thermodynamics');
    expect(r.blocks).toHaveLength(2);
  });

  test('extracts JSON from surrounding noise', () => {
    // Arrange
    const raw = `Here is the JSON:\n{"title":"A","blocks":[{"type":"paragraph","text":"B"}]}\nThanks`;

    // Act
    const r = parseStudyNotesJson(raw);

    // Assert
    expect(studyNotesResultSchema.safeParse(r).success).toBe(true);
    expect(r.title).toBe('A');
  });
});

describe('fallbackStudyNotesFromTranscript', () => {
  test('wraps empty transcript', () => {
    // Arrange
    const transcript = '   ';

    // Act
    const r = fallbackStudyNotesFromTranscript(transcript);

    // Assert
    expect(r.title).toBe('Study notes');
    expect(r.blocks[0]).toEqual({
      type: 'paragraph',
      text: '(Empty transcript)',
    });
  });
});

describe('sanitizeAudioToNoteTextField', () => {
  test('strips NUL and caps length', () => {
    // Arrange
    const withNul = 'a\u0000b';
    const long = 'abcdef';
    const optsShort = { maxChars: 99 };
    const optsCap = { maxChars: 3 };

    // Act
    const stripped = sanitizeAudioToNoteTextField(withNul, optsShort);
    const capped = sanitizeAudioToNoteTextField(long, optsCap);

    // Assert
    expect(stripped).toBe('ab');
    expect(capped).toBe('abc');
  });
});

describe('transcriptUserMessage', () => {
  test('wraps transcript with delimiters', () => {
    // Arrange
    const transcript = 'hello';

    // Act
    const m = transcriptUserMessage(transcript);

    // Assert
    expect(m).toContain('<<<NOTA_TRANSCRIPT>>>');
    expect(m).toContain('<<<END_NOTA_TRANSCRIPT>>>');
    expect(m).toContain('hello');
  });
});

describe('buildStudyNotesSystemPrompt', () => {
  test('embeds sanitised course name only', () => {
    // Arrange
    const courseName = 'Thermo\u0007';

    // Act
    const p = buildStudyNotesSystemPrompt(courseName);

    // Assert
    expect(p).toContain('Thermo');
    expect(p).not.toContain('\u0007');
  });
});
