import { describe, expect, it } from 'vitest';
import { parseNotaUpdateStatusPayload } from './nota-update-status';

describe('parseNotaUpdateStatusPayload', () => {
  it('parses a valid downloaded payload', () => {
    // Arrange
    const raw = { phase: 'downloaded', version: '1.2.3' };

    // Act
    const parsed = parseNotaUpdateStatusPayload(raw);

    // Assert
    expect(parsed).toEqual({ phase: 'downloaded', version: '1.2.3' });
  });

  it('rejects malformed payloads', () => {
    // Arrange
    const raw = { phase: 'downloaded', version: '' };

    // Act
    const parsed = parseNotaUpdateStatusPayload(raw);

    // Assert
    expect(parsed).toBeNull();
  });
});
