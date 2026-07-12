import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { NotePdfThumbnailFrame } from '@nota/editor';

describe('NotePdfThumbnailFrame', () => {
  it('covers the thumbnail area with a centred PDF placeholder when preview extraction fails', () => {
    // Arrange
    const canvasRef = createRef<HTMLCanvasElement>();

    // Act
    render(<NotePdfThumbnailFrame phase="error" canvasRef={canvasRef} />);

    // Assert
    const root = screen.getByTestId('note-pdf-thumbnail');
    const placeholder = screen.getByTestId('note-pdf-thumbnail-placeholder');

    expect(placeholder.textContent).toBe('PDF');
    expect(root.contains(placeholder)).toBe(true);
    expect(placeholder.parentElement?.className ?? '').toMatch(/absolute/);
    expect(placeholder.parentElement?.className ?? '').toMatch(/inset-2/);
  });

  it('shows loading copy while the thumbnail is generating', () => {
    // Arrange
    const canvasRef = createRef<HTMLCanvasElement>();

    // Act
    render(<NotePdfThumbnailFrame phase="loading" canvasRef={canvasRef} />);

    // Assert
    expect(screen.getByText('Loading preview…')).toBeTruthy();
    expect(screen.queryByTestId('note-pdf-thumbnail-placeholder')).toBeNull();
  });
});
