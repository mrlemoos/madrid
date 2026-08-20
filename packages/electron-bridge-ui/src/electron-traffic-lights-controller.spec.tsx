import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ElectronTrafficLightsController } from './electron-traffic-lights-controller';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';

describe('ElectronTrafficLightsController', () => {
  const setWindowButtonVisibility = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    setWindowButtonVisibility.mockClear();
    window.nota = { setWindowButtonVisibility } as unknown as Window['nota'];
  });

  afterEach(() => {
    cleanup();
    delete window.nota;
    useNotesSidebarStore.setState({ open: true });
  });

  it('hides the traffic lights while the sidebar is closed', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });

    // Act
    render(<ElectronTrafficLightsController />);

    // Assert
    expect(setWindowButtonVisibility).toHaveBeenCalledWith(false);
  });

  it('shows the traffic lights when the sidebar is open', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: true });

    // Act
    render(<ElectronTrafficLightsController />);

    // Assert
    expect(setWindowButtonVisibility).toHaveBeenCalledWith(true);
  });

  it('restores the traffic lights on unmount', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });
    const { unmount } = render(<ElectronTrafficLightsController />);
    setWindowButtonVisibility.mockClear();

    // Act
    unmount();

    // Assert
    expect(setWindowButtonVisibility).toHaveBeenCalledWith(true);
  });

  it('draws traffic-light outlines when the sidebar is closed over a banner note', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });

    // Act
    render(<ElectronTrafficLightsController hasBanner />);

    // Assert
    const outlines = screen.getByTestId('electron-traffic-light-outlines');
    expect(
      outlines.querySelectorAll('[data-traffic-light-outline]'),
    ).toHaveLength(3);
    expect(outlines.getAttribute('data-hover-revealed')).toBe('false');
  });

  it('does not draw traffic-light outlines when the closed sidebar has no banner', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });

    // Act
    render(<ElectronTrafficLightsController />);

    // Assert
    expect(screen.queryByTestId('electron-traffic-light-outlines')).toBeNull();
  });

  it('keeps the hover reveal and hides outlines while native buttons are shown', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });
    render(<ElectronTrafficLightsController hasBanner />);
    setWindowButtonVisibility.mockClear();
    const hoverZone = screen.getByTestId('electron-traffic-lights-hover-zone');

    // Act
    fireEvent.mouseEnter(hoverZone);

    // Assert
    expect(setWindowButtonVisibility).toHaveBeenCalledWith(true);
    expect(
      screen
        .getByTestId('electron-traffic-light-outlines')
        .getAttribute('data-hover-revealed'),
    ).toBe('true');
  });
});
