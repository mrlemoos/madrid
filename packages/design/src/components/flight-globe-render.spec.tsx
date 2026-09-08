import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FlightGlobe } from './flight-globe-render.js';

const MADRID = { lat: 40.4168, lng: -3.7038 };

describe('FlightGlobe renderer', () => {
  it('draws the world and a plane glyph at the given position', () => {
    // Arrange|Act
    const { container } = render(
      <FlightGlobe
        variant="flat"
        width={320}
        height={180}
        position={MADRID}
        heading={90}
      />,
    );

    // Assert
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('320');
    expect(svg?.getAttribute('height')).toBe('180');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(
      container.querySelector('g[transform*="rotate(90)"]'),
    ).not.toBeNull();
  });

  it('omits the plane glyph when no position is known', () => {
    // Arrange|Act
    const { container } = render(
      <FlightGlobe variant="flat" width={320} height={180} position={null} />,
    );

    // Assert
    expect(container.querySelector('g[transform*="rotate"]')).toBeNull();
  });

  it('defaults the heading to zero when the aircraft reports none', () => {
    // Arrange|Act
    const { container } = render(
      <FlightGlobe
        variant="flat"
        width={320}
        height={180}
        position={MADRID}
        heading={null}
      />,
    );

    // Assert
    expect(container.querySelector('g[transform*="rotate(0)"]')).not.toBeNull();
  });

  it('rotates the globe as the pointer drags', () => {
    // Arrange
    const { container } = render(
      <FlightGlobe
        variant="globe"
        width={240}
        height={240}
        position={MADRID}
        heading={0}
      />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    // jsdom has no pointer capture; the drag handler calls it unconditionally.
    svg.setPointerCapture = () => undefined;
    svg.releasePointerCapture = () => undefined;
    const before = container
      .querySelector('g[transform*="rotate"]')
      ?.getAttribute('transform');

    // Act
    fireEvent.pointerDown(svg, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(svg, { clientX: 160, clientY: 100 });
    fireEvent.pointerUp(svg);

    // Assert — the plane keeps its heading but moves with the rotated projection
    expect(
      container
        .querySelector('g[transform*="rotate"]')
        ?.getAttribute('transform'),
    ).not.toBe(before);
  });
});
