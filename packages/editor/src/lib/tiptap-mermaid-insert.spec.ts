import { describe, expect, it } from 'vitest';
import { MERMAID_CODE_BLOCK_INSERT } from './tiptap-mermaid-insert';

describe('MERMAID_CODE_BLOCK_INSERT', () => {
  it('is a mermaid codeBlock fragment with starter diagram text', () => {
    // Arrange
    const fragment = MERMAID_CODE_BLOCK_INSERT;

    // Act
    const language = fragment.attrs.language;
    const text = fragment.content[0]?.text;

    // Assert
    expect(fragment.type).toBe('codeBlock');
    expect(language).toBe('mermaid');
    expect(text).toContain('graph TD');
  });
});
