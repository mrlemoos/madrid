import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ElectronWindowDragBand } from './electron-window-drag-band';

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as { nota?: unknown }).nota;
});

describe('ElectronWindowDragBand', () => {
  it('renders nothing in the browser, where the title bar is the OS chrome', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605' });

    // Act
    const { container } = render(<ElectronWindowDragBand />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('paints a drag region under the hidden title bar in Electron', () => {
    // Arrange
    (window as { nota?: unknown }).nota = {};

    // Act
    const { container } = render(<ElectronWindowDragBand />);

    // Assert — the band drives `-webkit-app-region: drag`, which is behaviour, not styling
    const band = container.firstElementChild as HTMLElement;
    expect(band.className).toContain('electron-window-drag');
    expect(band.getAttribute('aria-hidden')).toBe('true');
  });
});
