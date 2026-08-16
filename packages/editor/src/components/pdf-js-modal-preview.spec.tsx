import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PdfJsModalPreview } from './pdf-js-modal-preview';

vi.mock('pdfjs-dist', () => ({
  getDocument: () => ({
    promise: Promise.reject(new Error('no pdf in unit test')),
  }),
  GlobalWorkerOptions: { workerSrc: '' },
}));

describe('PdfJsModalPreview', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows loading status initially and calls onRenderFailed on error', async () => {
    // Arrange
    const onRenderFailed = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    // Act
    render(
      <PdfJsModalPreview
        url="https://cdn.example.com/a.pdf"
        documentTitle="Doc"
        onRenderFailed={onRenderFailed}
      />,
    );

    // Assert
    expect(screen.getByText('Loading preview…')).toBeTruthy();
    await waitFor(() => {
      expect(onRenderFailed).toHaveBeenCalled();
    });
  });
});
