import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AuthHeaderDefault from './default';

describe('AuthHeaderDefault', () => {
  it('renders nothing, so an unmatched slot leaves no stray chrome', () => {
    // Arrange|Act — parallel routes require a default for every slot
    const { container } = render(<AuthHeaderDefault />);

    // Assert
    expect(AuthHeaderDefault()).toBeNull();
    expect(container.innerHTML).toBe('');
  });
});
