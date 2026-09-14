import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SidebarIconPreview } from './sidebar-icon-preview';

const t = ((key: string): string => key) as never;

describe('SidebarIconPreview', () => {
  it('draws note icons only when note icons are on', () => {
    // Arrange
    const { container, rerender } = render(
      <SidebarIconPreview showFolderIcons={false} showNoteIcons t={t} />,
    );

    // Act
    const withIcons = container.querySelectorAll(
      '[data-nota-sidebar-note-icon]',
    ).length;
    rerender(
      <SidebarIconPreview
        showFolderIcons={false}
        showNoteIcons={false}
        t={t}
      />,
    );

    // Assert
    expect(withIcons).toBe(2);
    expect(
      container.querySelectorAll('[data-nota-sidebar-note-icon]'),
    ).toHaveLength(0);
    expect(screen.getByText('Reading list')).toBeTruthy();
  });

  it('swaps the folder tint dot for a folder icon when folder icons are on', () => {
    // Arrange
    const { container, rerender } = render(
      <SidebarIconPreview showFolderIcons={false} showNoteIcons t={t} />,
    );

    // Act
    const dotOnly = container.querySelector('[data-nota-sidebar-folder-icon]');
    rerender(<SidebarIconPreview showFolderIcons showNoteIcons t={t} />);

    // Assert
    expect(dotOnly).toBeNull();
    expect(
      container.querySelector('[data-nota-sidebar-folder-icon]'),
    ).toBeTruthy();
  });
});
