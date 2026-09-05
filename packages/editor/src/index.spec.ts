import { describe, expect, it } from 'vitest';
import * as editor from './index';

describe('@getmadrid/editor public API', () => {
  it('exports core editor entry points', () => {
    // Arrange / Act
    const {
      TipTapEditor,
      NotaCodeBlock,
      NotaLink,
      convertLinkOnlyParagraphs,
      findFlightCodes,
      persistedDisplayTitle,
      safeOgImageSrcForPreview,
      findNoteMentionTrigger,
      tryConfirmNoteMention,
      NoteEditorCommandsProvider,
    } = editor;

    // Assert
    expect(TipTapEditor).toBeTypeOf('function');
    expect(NotaCodeBlock).toBeDefined();
    expect(NotaLink).toBeDefined();
    expect(convertLinkOnlyParagraphs).toBeTypeOf('function');
    expect(findFlightCodes).toBeTypeOf('function');
    expect(persistedDisplayTitle).toBeTypeOf('function');
    expect(safeOgImageSrcForPreview).toBeTypeOf('function');
    expect(findNoteMentionTrigger).toBeTypeOf('function');
    expect(tryConfirmNoteMention).toBeTypeOf('function');
    expect(NoteEditorCommandsProvider).toBeTypeOf('function');
  });
});
