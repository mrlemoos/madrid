import { beforeEach, describe, expect, it } from 'vitest';
import { useNotaPreferencesStore } from '../stores/nota-preferences';
import {
  createWritingActivitySessionRecorder,
  recordWritingActivityDay,
} from './writing-activity-tracking';

describe('writing activity tracking', () => {
  beforeEach(() => {
    // Arrange
    useNotaPreferencesStore.setState({
      writingActivityDays: {},
      preferencesPendingSync: false,
    });
  });

  it('records a day and marks preferences pending sync', () => {
    // Arrange
    const dateKey = '2026-05-29';

    // Act
    recordWritingActivityDay(dateKey);

    // Assert
    expect(useNotaPreferencesStore.getState().writingActivityDays).toEqual({
      [dateKey]: 1,
    });
    expect(useNotaPreferencesStore.getState().preferencesPendingSync).toBe(
      true,
    );
  });

  it('records once per local day until reset', () => {
    // Arrange
    const dates = [
      new Date('2026-05-29T10:00:00'),
      new Date('2026-05-29T11:00:00'),
      new Date('2026-05-30T10:00:00'),
    ];
    let index = 0;
    const recorder = createWritingActivitySessionRecorder({
      now: () => dates[index++],
    });

    // Act
    const first = recorder.record();
    const second = recorder.record();
    const third = recorder.record();
    recorder.reset();
    index = 1;
    const afterReset = recorder.record();

    // Assert
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(third).toBe(true);
    expect(afterReset).toBe(true);
    expect(useNotaPreferencesStore.getState().writingActivityDays).toEqual({
      '2026-05-29': 2,
      '2026-05-30': 1,
    });
  });
});
