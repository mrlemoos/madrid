import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchFlight = vi.fn();
const normalizeFlightCode = vi.fn();
const rateLimit = vi.fn(() => true);
const createUserRateLimiter = vi.fn(() => rateLimit);

vi.mock('server-only', () => ({}));
vi.mock('@/server/flight.server', () => ({ fetchFlight, normalizeFlightCode }));
vi.mock('@/server/user-rate-limit.server', () => ({ createUserRateLimiter }));

const route = await import('./route');

// The limiter is built at module load, before any `beforeEach` clears the mock.
const limiterConfig = createUserRateLimiter.mock.calls[0]?.[0];

function get(code: string | null, headers: Record<string, string> = {}) {
  const url = code
    ? `https://app.getmadrid.app/api/flight?code=${encodeURIComponent(code)}`
    : 'https://app.getmadrid.app/api/flight';
  return {
    url,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  rateLimit.mockReturnValue(true);
  normalizeFlightCode.mockImplementation((raw: string) =>
    /^[a-z]{2}\d{1,4}$/i.test(raw) ? raw.toUpperCase() : null,
  );
  fetchFlight.mockResolvedValue({ code: 'IB3100', status: 'en-route' });
});

describe('GET /api/flight', () => {
  it('is public and rate limited per client address', async () => {
    // Arrange|Act
    await route.GET(
      get('ib3100', { 'x-forwarded-for': '203.0.113.4, 10.0.0.1' }),
    );

    // Assert — the anon shared page calls this, so there is no session to key on
    expect(limiterConfig).toEqual({
      key: 'flight',
      max: 60,
      windowMs: 60_000,
    });
    expect(rateLimit).toHaveBeenCalledWith('203.0.113.4');
  });

  it('keys unknown callers together rather than exempting them', async () => {
    // Arrange|Act
    await route.GET(get('ib3100'));

    // Assert
    expect(rateLimit).toHaveBeenCalledWith('unknown');
  });

  it('returns the flight for a valid code', async () => {
    // Arrange|Act
    const response = await route.GET(get('ib3100'));

    // Assert
    expect(fetchFlight).toHaveBeenCalledWith('IB3100');
    await expect(response.json()).resolves.toEqual({
      code: 'IB3100',
      status: 'en-route',
    });
  });

  it('turns away a caller over the quota', async () => {
    // Arrange
    rateLimit.mockReturnValue(false);

    // Act
    const response = await route.GET(get('ib3100'));

    // Assert
    expect(response.status).toBe(429);
    expect(fetchFlight).not.toHaveBeenCalled();
  });

  it('rejects a missing or malformed code', async () => {
    // Arrange|Act
    const missing = await route.GET(get(null));
    const malformed = await route.GET(get('not-a-flight'));

    // Assert
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({ error: 'Missing code' });
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toEqual({
      error: 'Invalid flight code',
    });
  });

  it('answers 404 for a flight the upstream does not know', async () => {
    // Arrange
    fetchFlight.mockResolvedValue(null);

    // Act
    const response = await route.GET(get('ib3100'));

    // Assert
    expect(response.status).toBe(404);
  });

  it('answers 502 when the upstream itself failed', async () => {
    // Arrange
    fetchFlight.mockRejectedValue(new Error('AirLabs unavailable'));

    // Act
    const response = await route.GET(get('ib3100'));

    // Assert — the caller's request was fine; the upstream was not
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'AirLabs unavailable',
    });
  });
});
