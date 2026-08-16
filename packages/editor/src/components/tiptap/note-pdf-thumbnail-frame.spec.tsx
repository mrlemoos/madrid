import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotePdfThumbnailFrame } from './note-pdf-thumbnail-frame';

describe('NotePdfThumbnailFrame', () => {
  it('shows loading copy while phase is loading', () => {
    // Arrange
    const canvasRef = createRef<HTMLCanvasElement>();

    // Act
    render(<NotePdfThumbnailFrame phase="loading" canvasRef={canvasRef} />);

    // Assert
    expect(screen.getByTestId('note-pdf-thumbnail')).toBeTruthy();
    expect(screen.getByText('Loading preview…')).toBeTruthy();
  });

  it('shows PDF placeholder on error', () => {
    // Arrange
    const canvasRef = createRef<HTMLCanvasElement>();

    // Act
    render(<NotePdfThumbnailFrame phase="error" canvasRef={canvasRef} />);

    // Assert
    expect(
      screen.getByTestId('note-pdf-thumbnail-placeholder').textContent,
    ).toBe('PDF');
  });

  it('hides placeholder overlay when ready', () => {
    // Arrange
    const canvasRef = createRef<HTMLCanvasElement>();

    // Act
    render(<NotePdfThumbnailFrame phase="ready" canvasRef={canvasRef} />);

    // Assert
    expect(screen.queryByText('Loading preview…')).toBeNull();
    expect(screen.queryByTestId('note-pdf-thumbnail-placeholder')).toBeNull();
  });
});
