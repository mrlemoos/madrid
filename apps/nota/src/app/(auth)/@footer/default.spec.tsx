import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AuthFooterDefault from './default';

describe('AuthFooterDefault', () => {
  it('renders nothing, so an unmatched slot leaves no stray chrome', () => {
    // Arrange|Act — parallel routes require a default for every slot
    const { container } = render(<AuthFooterDefault />);

    // Assert
    expect(AuthFooterDefault()).toBeNull();
    expect(container.innerHTML).toBe('');
  });
});
