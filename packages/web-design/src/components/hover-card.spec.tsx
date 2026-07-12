import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  NotaHoverCard,
  NotaHoverCardPopup,
  NotaHoverCardPortal,
  NotaHoverCardPositioner,
  NotaHoverCardTrigger,
} from './hover-card.js';

describe('NotaHoverCard (named exports)', () => {
  it('exposes Root, Trigger, Portal, Positioner, and Popup', () => {
    // Assert
    expect(NotaHoverCard).toBeDefined();
    expect(NotaHoverCardTrigger).toBeDefined();
    expect(NotaHoverCardPortal).toBeDefined();
    expect(NotaHoverCardPositioner).toBeDefined();
    expect(NotaHoverCardPopup).toBeDefined();
  });
});

describe('NotaHoverCardPopup (default popover styles)', () => {
  it('applies the shared hover card surface tokens', () => {
    // Arrange
    const { baseElement } = render(
      <NotaHoverCard defaultOpen>
        <NotaHoverCardTrigger
          nativeButton={false}
          render={<span>Anchor</span>}
        />
        <NotaHoverCardPortal>
          <NotaHoverCardPositioner side="top" sideOffset={8}>
            <NotaHoverCardPopup>Card body</NotaHoverCardPopup>
          </NotaHoverCardPositioner>
        </NotaHoverCardPortal>
      </NotaHoverCard>,
    );

    // Act
    const popup = within(baseElement).getByText('Card body', { exact: true });
    const surface = popup.closest('div') ?? popup;
    const classes = surface.className.split(/\s+/).filter(Boolean);

    // Assert
    for (const token of [
      'z-50',
      'w-80',
      'rounded-xl',
      'border',
      'border-border',
      'bg-popover',
      'text-popover-foreground',
      'shadow-lg',
    ]) {
      expect(classes).toContain(token);
    }
  });
});

describe('NotaHoverCardPopup (motion)', () => {
  it('applies shared popup motion tokens including duration and easing', () => {
    // Arrange
    const { baseElement } = render(
      <NotaHoverCard defaultOpen>
        <NotaHoverCardTrigger
          nativeButton={false}
          render={<span>Anchor</span>}
        />
        <NotaHoverCardPortal>
          <NotaHoverCardPositioner side="top" sideOffset={8}>
            <NotaHoverCardPopup>Card body</NotaHoverCardPopup>
          </NotaHoverCardPositioner>
        </NotaHoverCardPortal>
      </NotaHoverCard>,
    );

    // Act
    const popup = within(baseElement).getByText('Card body', { exact: true });
    const surface = popup.closest('div') ?? popup;
    const classes = surface.className.split(/\s+/).filter(Boolean);

    // Assert
    for (const token of [
      'origin-[var(--transform-origin)]',
      'transition-[transform,scale,opacity]',
      'duration-200',
      'ease-out',
      'data-[starting-style]:scale-95',
      'data-[ending-style]:scale-95',
    ]) {
      expect(classes).toContain(token);
    }
  });
});
