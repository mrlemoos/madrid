import { render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ElectronTrafficLightsController } from './electron-traffic-lights-controller';
import { useNotesSidebarStore } from '@/stores/notes-sidebar';

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
});
