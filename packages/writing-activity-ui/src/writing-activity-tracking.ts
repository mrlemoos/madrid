import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';
import { localDateKey } from '@getmadrid/note-journal-core/local-date-key';
import { incrementActivityDay } from '@getmadrid/writing-activity-core/writing-activity';

export function recordWritingActivityDay(dateKey: string): void {
  const { writingActivityDays, setWritingActivityDays } =
    useNotaPreferencesStore.getState();

  setWritingActivityDays(incrementActivityDay(writingActivityDays, dateKey));
}

export function recordWritingActivityToday(date = new Date()): void {
  recordWritingActivityDay(localDateKey(date));
}

export function createWritingActivitySessionRecorder(options?: {
  now?: () => Date;
}): {
  record: () => boolean;
  reset: () => void;
} {
  let lastRecordedDateKey: string | null = null;

  return {
    record: () => {
      const dateKey = localDateKey(options?.now?.() ?? new Date());
      if (dateKey === lastRecordedDateKey) {
        return false;
      }

      recordWritingActivityDay(dateKey);
      lastRecordedDateKey = dateKey;
      return true;
    },
    reset: () => {
      lastRecordedDateKey = null;
    },
  };
}
