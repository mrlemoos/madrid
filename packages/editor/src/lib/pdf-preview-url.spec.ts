import { describe, expect, it } from 'vitest';
import { pdfPreviewSrc } from './pdf-preview-url';

describe('pdfPreviewSrc', () => {
  it('appends viewer fragment when url has no hash', () => {
    // Arrange
    const url = 'https://cdn.example.com/doc.pdf';

    // Act
    const result = pdfPreviewSrc(url);

    // Assert
    expect(result).toBe('https://cdn.example.com/doc.pdf#toolbar=0&navpanes=0');
  });

  it('merges toolbar and navpanes into an existing fragment', () => {
    // Arrange
    const url = 'https://cdn.example.com/doc.pdf#page=2';

    // Act
    const result = pdfPreviewSrc(url);

    // Assert
    expect(result.startsWith('https://cdn.example.com/doc.pdf#')).toBe(true);
    const params = new URLSearchParams(result.slice(result.indexOf('#') + 1));
    expect(params.get('page')).toBe('2');
    expect(params.get('toolbar')).toBe('0');
    expect(params.get('navpanes')).toBe('0');
  });

  it('overwrites existing toolbar and navpanes values', () => {
    // Arrange
    const url = 'https://cdn.example.com/doc.pdf#toolbar=1&navpanes=1';

    // Act
    const result = pdfPreviewSrc(url);

    // Assert
    const params = new URLSearchParams(result.slice(result.indexOf('#') + 1));
    expect(params.get('toolbar')).toBe('0');
    expect(params.get('navpanes')).toBe('0');
  });
});
