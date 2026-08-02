import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NoteImageLightbox } from './note-image-lightbox';

const { isElectronMock } = vi.hoisted(() => ({
  isElectronMock: vi.fn(() => false),
}));

vi.mock('@nota/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => isElectronMock(),
}));

describe('NoteImageLightbox', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps portal mounted briefly after open becomes false', () => {
    // Arrange
    const image = {
      src: 'https://cdn.example.test/photo.webp',
      alt: 'Coastline at dusk',
      filename: 'Coastline.webp',
    };

    vi.useFakeTimers();

    const { rerender } = render(
      <NoteImageLightbox open image={image} onClose={() => {}} />,
    );

    // Act
    rerender(
      <NoteImageLightbox open={false} image={image} onClose={() => {}} />,
    );

    // Assert
    expect(screen.getByTestId('note-image-lightbox-backdrop')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByTestId('note-image-lightbox-backdrop')).toBeNull();
  });

  it('sets data-mounted on backdrop when open', async () => {
    // Arrange
    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={() => {}}
      />,
    );

    // Act
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // Assert
    expect(
      screen
        .getByTestId('note-image-lightbox-backdrop')
        .getAttribute('data-mounted'),
    ).toBe('true');
  });

  it('renders full-screen image metadata and closes on close button', () => {
    // Arrange
    const onClose = vi.fn();

    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={onClose}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: /close image view/i }));

    // Assert
    expect(screen.getByRole('img', { name: 'Coastline at dusk' })).toBeTruthy();
    expect(screen.getByText('Coastline.webp')).toBeTruthy();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click and Escape key', () => {
    // Arrange
    const onClose = vi.fn();

    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={onClose}
      />,
    );

    // Act
    fireEvent.click(screen.getByTestId('note-image-lightbox-backdrop'));
    fireEvent.keyDown(document, { key: 'Escape' });

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('adds traffic-light spacing when running in Electron', () => {
    // Arrange
    isElectronMock.mockReturnValue(true);

    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={() => {}}
      />,
    );

    // Act
    const filenameLabel = screen.getByText('Coastline.webp');

    // Assert
    expect(filenameLabel.closest('header')?.className).toContain('pl-20');
  });
});
