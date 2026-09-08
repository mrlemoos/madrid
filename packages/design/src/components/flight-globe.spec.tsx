import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FlightGlobe } from './flight-globe.js';

describe('FlightGlobe', () => {
  it('reserves the requested box while the renderer chunk loads', () => {
    // Arrange|Act — the fallback paints before the lazy import settles
    const { container } = render(
      <FlightGlobe variant="flat" width={320} height={180} position={null} />,
    );

    // Assert
    const placeholder = container.firstElementChild as HTMLElement | null;
    expect(placeholder?.style.width).toBe('320px');
    expect(placeholder?.style.height).toBe('180px');
  });

  it('swaps in the real renderer once the chunk resolves', async () => {
    // Arrange|Act
    const { container } = render(
      <FlightGlobe
        variant="flat"
        width={320}
        height={180}
        position={{ lat: 40.4, lng: -3.7 }}
        heading={90}
      />,
    );

    // Assert
    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull();
    });
  });
});
