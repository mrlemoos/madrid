import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchFlightInfo, type FlightInfo } from './flight-client';

describe('fetchFlightInfo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns flight info on 200', async () => {
    // Arrange
    const payload: FlightInfo = {
      code: 'AA123',
      airlineIata: 'AA',
      depIata: 'JFK',
      arrIata: 'LAX',
      status: 'en-route',
      airborne: true,
      lat: 40,
      lng: -100,
      dir: 270,
      alt: 10000,
      speed: 450,
      depTime: null,
      arrTime: null,
      updated: 1,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);

    // Act
    const result = await fetchFlightInfo('AA123');

    // Assert
    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/flight?code=AA123',
      expect.objectContaining({ signal: undefined }),
    );
  });

  it('returns null on 404', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404, ok: false }),
    );

    // Act
    const result = await fetchFlightInfo('ZZ999');

    // Assert
    expect(result).toBeNull();
  });

  it('throws on non-404 failure', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 500, ok: false }),
    );

    // Act
    const act = fetchFlightInfo('AA123');

    // Assert
    await expect(act).rejects.toThrow('Flight lookup failed (500)');
  });

  it('encodes the flight code in the query string', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });
    vi.stubGlobal('fetch', fetchMock);

    // Act
    await fetchFlightInfo('A A');

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/flight?code=A%20A',
      expect.any(Object),
    );
  });
});
