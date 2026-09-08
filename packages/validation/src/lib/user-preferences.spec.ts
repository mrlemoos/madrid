import { describe, expect, it } from 'vitest';

import { updateUserPreferencesFormSchema } from './user-preferences';

describe('updateUserPreferencesFormSchema', () => {
  it('turns the form string into a boolean', () => {
    // Arrange|Act
    const on = updateUserPreferencesFormSchema.parse({
      intent: 'updateUserPreferences',
      openTodaysNoteShortcut: 'true',
    });
    const off = updateUserPreferencesFormSchema.parse({
      intent: 'updateUserPreferences',
      openTodaysNoteShortcut: 'false',
    });

    // Assert
    expect(on.openTodaysNoteShortcut).toBe(true);
    expect(off.openTodaysNoteShortcut).toBe(false);
  });

  it('rejects a payload aimed at a different intent', () => {
    // Arrange|Act
    const result = updateUserPreferencesFormSchema.safeParse({
      intent: 'deleteNote',
      openTodaysNoteShortcut: 'true',
    });

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects anything but the two form strings', () => {
    // Arrange|Act
    const result = updateUserPreferencesFormSchema.safeParse({
      intent: 'updateUserPreferences',
      openTodaysNoteShortcut: true,
    });

    // Assert
    expect(result.success).toBe(false);
  });
});
