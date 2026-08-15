import { describe, expect, it } from 'vitest';
import {
  airlabsRecords,
  normalizeFlightCode,
  normalizeLive,
  normalizeSchedule,
} from './flight.server';

describe('normalizeFlightCode', () => {
  it('canonicalizes valid codes (uppercase, spaces stripped)', () => {
    // Arrange
    const inputs = ['aa123', 'AA 123', 'U2 5000', '3U8888'];
    const expected = ['AA123', 'AA123', 'U25000', '3U8888'];

    // Act
    const actual = inputs.map((code) => normalizeFlightCode(code));

    // Assert
    expect(actual).toEqual(expected);
  });

  it('rejects tokens that cannot be a flight code', () => {
    // Arrange
    const invalid = ['HELLO', 'A1', 'AA12345', '123'];

    // Act
    const results = invalid.map((token) => normalizeFlightCode(token));

    // Assert
    expect(results).toEqual([null, null, null, null]);
  });
});

describe('airlabsRecords', () => {
  it('returns the response array on success', () => {
    // Arrange
    const payload = { response: [{ a: 1 }] };

    // Act
    const records = airlabsRecords(payload);

    // Assert
    expect(records).toEqual([{ a: 1 }]);
  });

  it('returns an empty array for an error envelope or non-object', () => {
    // Arrange
    const errorPayload = { error: { message: 'x' } };

    // Act
    const fromError = airlabsRecords(errorPayload);
    const fromNull = airlabsRecords(null);

    // Assert
    expect(fromError).toEqual([]);
    expect(fromNull).toEqual([]);
  });
});

describe('normalizeLive', () => {
  it('maps an airborne record and flags airborne when lat/lng present', () => {
    // Arrange
    const code = 'AA123';
    const record = {
      flight_iata: 'AA123',
      airline_iata: 'AA',
      dep_iata: 'JFK',
      arr_iata: 'LHR',
      status: 'en-route',
      lat: 51.4,
      lng: -0.4,
      dir: 270,
      alt: 11000,
      speed: 900,
      updated: 1_700_000_000,
    };

    // Act
    const info = normalizeLive(code, record);

    // Assert
    expect(info.airborne).toBe(true);
    expect(info.lat).toBe(51.4);
    expect(info.arrIata).toBe('LHR');
    expect(info.depTime).toBeNull();
  });

  it('is not airborne when position is missing', () => {
    // Arrange
    const code = 'AA123';
    const record = { airline_iata: 'AA' };

    // Act
    const info = normalizeLive(code, record);

    // Assert
    expect(info.airborne).toBe(false);
    expect(info.lat).toBeNull();
  });
});

describe('normalizeSchedule', () => {
  it('prefers estimated over scheduled times and never marks airborne', () => {
    // Arrange
    const code = 'AA123';
    const record = {
      airline_iata: 'AA',
      dep_iata: 'GYN',
      arr_iata: 'GRU',
      status: 'scheduled',
      dep_time: '2026-07-30 14:30',
      dep_estimated: '2026-07-30 14:45',
      arr_time: '2026-07-30 16:00',
    };

    // Act
    const info = normalizeSchedule(code, record);

    // Assert
    expect(info.airborne).toBe(false);
    expect(info.depTime).toBe('2026-07-30 14:45');
    expect(info.arrTime).toBe('2026-07-30 16:00');
  });
});
