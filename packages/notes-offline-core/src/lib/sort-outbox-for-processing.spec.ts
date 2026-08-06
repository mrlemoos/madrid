import { describe, expect, it } from 'vitest';
import { sortOutboxForProcessing } from './sort-outbox-for-processing';
import type { OutboxEntry } from './types';

describe('sortOutboxForProcessing', () => {
  it('orders upsert before delete for the same note id', () => {
    // Arrange
    const entries: OutboxEntry[] = [
      { noteId: 'a', kind: 'delete' },
      { noteId: 'a', kind: 'upsert' },
    ];

    // Act
    const sorted = sortOutboxForProcessing(entries);

    // Assert
    expect(sorted.map((e: OutboxEntry) => e.kind)).toEqual([
      'upsert',
      'delete',
    ]);
  });

  it('sorts by note id for stable processing', () => {
    // Arrange
    const entries: OutboxEntry[] = [
      { noteId: 'z', kind: 'upsert' },
      { noteId: 'm', kind: 'delete' },
    ];

    // Act
    const sorted = sortOutboxForProcessing(entries);

    // Assert
    expect(sorted.map((e: OutboxEntry) => e.noteId)).toEqual(['m', 'z']);
  });
});
