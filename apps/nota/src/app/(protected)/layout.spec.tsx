import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('@clerk/nextjs/server', () => ({ auth }));
vi.mock('next/navigation', () => ({ redirect }));

const { default: ProtectedLayout } = await import('./layout');

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: 'user-1' });
});

describe('ProtectedLayout', () => {
  it('renders the workspace for a signed-in reader', async () => {
    // Arrange|Act
    const element = await ProtectedLayout({ children: 'vault' });

    // Assert
    expect(element.props.children).toBe('vault');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to sign in, without rendering the vault', async () => {
    // Arrange
    auth.mockResolvedValue({ userId: null });

    // Act|Assert — the gate is here, where the data is served, not in middleware
    await expect(ProtectedLayout({ children: 'vault' })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(redirect).toHaveBeenCalledWith('/signin');
  });
});
