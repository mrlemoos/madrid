import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  HoverCard,
  HoverCardPopup,
  HoverCardPortal,
  HoverCardPositioner,
  HoverCardTrigger,
} from './hover-card.js';

describe('HoverCard (named exports)', () => {
  it('exposes Root, Trigger, Portal, Positioner, and Popup', () => {
    // Assert
    expect(HoverCard).toBeDefined();
    expect(HoverCardTrigger).toBeDefined();
    expect(HoverCardPortal).toBeDefined();
    expect(HoverCardPositioner).toBeDefined();
    expect(HoverCardPopup).toBeDefined();
  });
});

describe('HoverCardPopup (rendering)', () => {
  it('renders the popup content when open', () => {
    // Arrange / Act
    const { baseElement } = render(
      <HoverCard defaultOpen>
        <HoverCardTrigger nativeButton={false} render={<span>Anchor</span>} />
        <HoverCardPortal>
          <HoverCardPositioner side="top" sideOffset={8}>
            <HoverCardPopup>Card body</HoverCardPopup>
          </HoverCardPositioner>
        </HoverCardPortal>
      </HoverCard>,
    );

    // Assert — getByText throws if the popup content isn't rendered
    expect(
      within(baseElement).getByText('Card body', { exact: true }),
    ).toBeTruthy();
  });
});
