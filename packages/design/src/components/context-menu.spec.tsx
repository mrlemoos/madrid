import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuTrigger,
  ContextMenuViewport,
} from './context-menu.js';

describe('ContextMenu (named exports)', () => {
  it('exposes Root, Trigger, Portal, Positioner, Popup, Viewport, and Item', () => {
    // Assert
    expect(ContextMenu).toBeDefined();
    expect(ContextMenuTrigger).toBeDefined();
    expect(ContextMenuPortal).toBeDefined();
    expect(ContextMenuPositioner).toBeDefined();
    expect(ContextMenuPopup).toBeDefined();
    expect(ContextMenuViewport).toBeDefined();
    expect(ContextMenuItem).toBeDefined();
  });
});

describe('ContextMenuPositioner (default layering)', () => {
  it('applies the shared popover z-index to the positioner', () => {
    // Arrange
    const { baseElement } = render(
      <ContextMenu defaultOpen>
        <ContextMenuTrigger render={<span>Anchor</span>} />
        <ContextMenuPortal>
          <ContextMenuPositioner side="right" sideOffset={4}>
            <ContextMenuPopup>
              <ContextMenuViewport>
                <ContextMenuItem>Rename</ContextMenuItem>
              </ContextMenuViewport>
            </ContextMenuPopup>
          </ContextMenuPositioner>
        </ContextMenuPortal>
      </ContextMenu>,
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

describe('ContextMenuPopup (motion)', () => {
  it('applies trigger origin and 150–200ms ease-out enter/exit', () => {
    // Arrange
    const { baseElement } = render(
      <ContextMenu defaultOpen>
        <ContextMenuTrigger render={<span>Anchor</span>} />
        <ContextMenuPortal>
          <ContextMenuPositioner side="right" sideOffset={4}>
            <ContextMenuPopup>
              <ContextMenuViewport>
                <ContextMenuItem>Rename</ContextMenuItem>
              </ContextMenuViewport>
            </ContextMenuPopup>
          </ContextMenuPositioner>
        </ContextMenuPortal>
      </ContextMenu>,
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
