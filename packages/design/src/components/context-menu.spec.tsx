import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  NotaContextMenu,
  NotaContextMenuItem,
  NotaContextMenuPopup,
  NotaContextMenuPortal,
  NotaContextMenuPositioner,
  NotaContextMenuTrigger,
  NotaContextMenuViewport,
} from './context-menu.js';

describe('NotaContextMenu (named exports)', () => {
  it('exposes Root, Trigger, Portal, Positioner, Popup, Viewport, and Item', () => {
    // Assert
    expect(NotaContextMenu).toBeDefined();
    expect(NotaContextMenuTrigger).toBeDefined();
    expect(NotaContextMenuPortal).toBeDefined();
    expect(NotaContextMenuPositioner).toBeDefined();
    expect(NotaContextMenuPopup).toBeDefined();
    expect(NotaContextMenuViewport).toBeDefined();
    expect(NotaContextMenuItem).toBeDefined();
  });
});

describe('NotaContextMenuPositioner (default layering)', () => {
  it('applies the shared popover z-index to the positioner', () => {
    // Arrange
    const { baseElement } = render(
      <NotaContextMenu defaultOpen>
        <NotaContextMenuTrigger render={<span>Anchor</span>} />
        <NotaContextMenuPortal>
          <NotaContextMenuPositioner side="right" sideOffset={4}>
            <NotaContextMenuPopup>
              <NotaContextMenuViewport>
                <NotaContextMenuItem>Rename</NotaContextMenuItem>
              </NotaContextMenuViewport>
            </NotaContextMenuPopup>
          </NotaContextMenuPositioner>
        </NotaContextMenuPortal>
      </NotaContextMenu>,
    );

    // Act
    const item = within(baseElement).getByText('Rename', { exact: true });
    const positioner = item.closest('[role="menu"]')?.parentElement;

    // Assert
    expect(positioner?.className.split(/\s+/).filter(Boolean)).toContain(
      'z-50',
    );
  });
});

describe('NotaContextMenuPopup (motion)', () => {
  it('applies trigger origin and 150–200ms ease-out enter/exit', () => {
    // Arrange
    const { baseElement } = render(
      <NotaContextMenu defaultOpen>
        <NotaContextMenuTrigger render={<span>Anchor</span>} />
        <NotaContextMenuPortal>
          <NotaContextMenuPositioner side="right" sideOffset={4}>
            <NotaContextMenuPopup>
              <NotaContextMenuViewport>
                <NotaContextMenuItem>Rename</NotaContextMenuItem>
              </NotaContextMenuViewport>
            </NotaContextMenuPopup>
          </NotaContextMenuPositioner>
        </NotaContextMenuPortal>
      </NotaContextMenu>,
    );

    // Act
    const item = within(baseElement).getByText('Rename', { exact: true });
    const popup = item.closest('[role="menu"]');
    const classes = popup?.className.split(/\s+/).filter(Boolean) ?? [];

    // Assert — origin from trigger; duration in the 150–200ms polish band
    expect(classes).toContain('origin-[var(--transform-origin)]');
    expect(classes).toContain('duration-200');
    expect(classes).toContain('ease-out');
    expect(classes).toContain('data-[starting-style]:scale-95');
    expect(classes).toContain('data-[starting-style]:opacity-0');
  });
});
