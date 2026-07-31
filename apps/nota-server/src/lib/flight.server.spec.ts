import { describe, expect, it } from 'bun:test';
import {
  airlabsRecords,
  normalizeFlightCode,
  normalizeLive,
  normalizeSchedule,
} from './flight.server.ts';

describe('normalizeFlightCode', () => {
  it('accepts and canonicalizes valid codes', () => {
    // Arrange / Act / Assert
    expect(normalizeFlightCode('aa123')).toBe('AA123');
    expect(normalizeFlightCode('AA 123')).toBe('AA123');
    expect(normalizeFlightCode('U2 5000')).toBe('U25000');
    expect(normalizeFlightCode('3U8888')).toBe('3U8888');
  });

  it('rejects non-flight tokens', () => {
    // Arrange / Act / Assert
    expect(normalizeFlightCode('HELLO')).toBeNull();
    expect(normalizeFlightCode('A1')).toBeNull(); // no digits after 2-char prefix
    expect(normalizeFlightCode('AA12345')).toBeNull(); // 5 digits
    expect(normalizeFlightCode('123')).toBeNull();
  });
});

describe('airlabsRecords', () => {
  it('extracts the response array, else empty', () => {
    // Arrange / Act / Assert
    expect(airlabsRecords({ response: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    expect(airlabsRecords({ error: { message: 'x' } })).toEqual([]);
    expect(airlabsRecords(null)).toEqual([]);
  });
});

describe('normalizeLive', () => {
  it('maps an airborne record and flags airborne when lat/lng present', () => {
    // Arrange
    const rec = {
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
    const info = normalizeLive('AA123', rec);
    // Assert
    expect(info.airborne).toBe(true);
    expect(info.lat).toBe(51.4);
    expect(info.arrIata).toBe('LHR');
    expect(info.depTime).toBeNull();
  });

  it('is not airborne when position missing', () => {
    // Arrange / Act
    const info = normalizeLive('AA123', { airline_iata: 'AA' });
    // Assert
    expect(info.airborne).toBe(false);
    expect(info.lat).toBeNull();
  });
});

describe('normalizeSchedule', () => {
  it('prefers estimated over scheduled times and never marks airborne', () => {
    // Arrange
    const rec = {
      airline_iata: 'AA',
      dep_iata: 'GYN',
      arr_iata: 'GRU',
      status: 'scheduled',
      dep_time: '2026-07-30 14:30',
      dep_estimated: '2026-07-30 14:45',
      arr_time: '2026-07-30 16:00',
    };
    // Act
    const info = normalizeSchedule('AA123', rec);
    // Assert
    expect(info.airborne).toBe(false);
    expect(info.depTime).toBe('2026-07-30 14:45');
    expect(info.arrTime).toBe('2026-07-30 16:00');
  });
});
