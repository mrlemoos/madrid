import { describe, expect, it, vi } from 'vitest';

vi.mock('grabkit', () => ({
  default: vi.fn((baseURL: string, options: unknown) => ({
    baseURL,
    options,
  })),
}));

const { default: grabkit } = await import('grabkit');
const { appApiGrab } = await import('./app-api-grab');

describe('appApiGrab', () => {
  it('builds against the current origin so relative /api paths resolve', () => {
    // Arrange|Act
    const grab = appApiGrab() as unknown as { baseURL: string };

    // Assert
    expect(grab.baseURL).toBe(window.location.origin);
  });

  it('asks for plain JSON, not JSON:API', () => {
    // Arrange|Act
    appApiGrab();

    // Assert — JSON:API mode would demand a `type` field on every write body
    expect(vi.mocked(grabkit).mock.calls[0]?.[1]).toEqual({ format: 'json' });
  });

  it('builds the callable once and reuses it', () => {
    // Arrange
    const before = vi.mocked(grabkit).mock.calls.length;

    // Act
    const first = appApiGrab();
    const second = appApiGrab();

    // Assert
    expect(second).toBe(first);
    expect(vi.mocked(grabkit).mock.calls.length).toBe(before);
  });
});
