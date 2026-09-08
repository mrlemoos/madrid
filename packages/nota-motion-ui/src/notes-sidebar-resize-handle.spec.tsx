import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotesSidebarResizeHandle } from './notes-sidebar-resize-handle';

describe('NotesSidebarResizeHandle', () => {
  it('is a labelled vertical separator for assistive tech', () => {
    // Arrange|Act
    render(
      <NotesSidebarResizeHandle
        ariaLabel="Resize sidebar"
        onPointerDown={vi.fn()}
      />,
    );

    // Assert
    const handle = screen.getByRole('separator', { name: 'Resize sidebar' });
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('stays out of the tab order, since the drag is pointer-only', () => {
    // Arrange|Act
    render(
      <NotesSidebarResizeHandle ariaLabel="Resize" onPointerDown={vi.fn()} />,
    );

    // Assert
    expect(screen.getByRole('separator').getAttribute('tabindex')).toBe('-1');
  });

  it('starts the drag on pointer down', () => {
    // Arrange
    const onPointerDown = vi.fn();
    render(
      <NotesSidebarResizeHandle
        ariaLabel="Resize"
        onPointerDown={onPointerDown}
      />,
    );

    // Act
    fireEvent.pointerDown(screen.getByRole('separator'));

    // Assert
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it('opts out of the Electron window drag region', () => {
    // Arrange|Act
    render(
      <NotesSidebarResizeHandle ariaLabel="Resize" onPointerDown={vi.fn()} />,
    );

    // Assert — `-webkit-app-region` would otherwise swallow the drag
    expect(screen.getByRole('separator').className).toContain(
      'electron-window-no-drag',
    );
  });
});
