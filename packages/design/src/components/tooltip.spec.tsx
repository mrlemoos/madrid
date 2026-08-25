import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Tooltip,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip.js';

describe('Tooltip (named exports)', () => {
  it('exposes Provider, Root, Trigger, Portal, Positioner, Popup', () => {
    // Assert
    expect(TooltipProvider).toBeDefined();
    expect(Tooltip).toBeDefined();
    expect(TooltipTrigger).toBeDefined();
    expect(TooltipPortal).toBeDefined();
    expect(TooltipPositioner).toBeDefined();
    expect(TooltipPopup).toBeDefined();
  });
});

describe('TooltipPositioner (default layering)', () => {
  it('applies the shared popover z-index to the positioner', () => {
    // Arrange
    const { baseElement } = render(
      <TooltipProvider delay={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger render={<span>Anchor</span>} />
          <TooltipPortal>
            <TooltipPositioner side="top" sideOffset={6}>
              <TooltipPopup>Test label</TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );

    // Act
    const popup = within(baseElement).getByText('Test label', { exact: true });
    const positioner = popup.parentElement;

    // Assert — z on positioner (portal root), not only popup, so chrome stacks above sidebar
    expect(positioner?.className.split(/\s+/).filter(Boolean)).toContain(
      'z-50',
    );
  });
});

describe('TooltipPopup (default popover styles)', () => {
  it('applies the shared nota popover class tokens on TooltipPopup', () => {
    // Arrange|Act: defaultOpen avoids flaky hover simulation in JSDOM
    const { baseElement } = render(
      <TooltipProvider delay={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger render={<span>Anchor</span>} />
          <TooltipPortal>
            <TooltipPositioner side="top" sideOffset={6}>
              <TooltipPopup>Test label</TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>,
    );

    // Assert
    const popup = within(baseElement).getByText('Test label', { exact: true });
    const surface = popup.closest('div') ?? popup;
    const classes = surface.className.split(/\s+/).filter(Boolean);
    for (const token of [
      'max-w-xs',
      'rounded-md',
      'border',
      'border-border',
      'bg-popover',
      'px-2',
      'py-1',
      'text-popover-foreground',
      'text-xs',
      'shadow-md',
    ]) {
      expect(classes).toContain(token);
    }
  });
});
