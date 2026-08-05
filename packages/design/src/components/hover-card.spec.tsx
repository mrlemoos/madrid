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

describe('NotaHoverCardPopup (rendering)', () => {
  it('renders the popup content when open', () => {
    // Arrange / Act
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

    // Assert — getByText throws if the popup content isn't rendered
    expect(
      within(baseElement).getByText('Card body', { exact: true }),
    ).toBeTruthy();
  });
});
