import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/hero-stage/hero-stage', () => ({
  HeroStage: () => null,
}));

const { default: HeroStagePage } = await import('./page');

const ORIGINAL_ENV = process.env.NODE_ENV;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.stubEnv('NODE_ENV', ORIGINAL_ENV ?? 'test');
  vi.unstubAllEnvs();
});

describe('HeroStagePage', () => {
  it('renders the recording surface outside production', () => {
    // Arrange
    vi.stubEnv('NODE_ENV', 'development');

    // Act
    const element = HeroStagePage();

    // Assert
    expect(element).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('404s in production, so the route never ships', () => {
    // Arrange
    vi.stubEnv('NODE_ENV', 'production');

    // Act|Assert
    expect(() => HeroStagePage()).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
