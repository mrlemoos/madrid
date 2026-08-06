import { describe, expect, it } from 'vitest';
import {
  folderHasPersistedTint,
  folderTintRowBackground,
  folderTintSwatchColour,
  folderTintOptionForPersisted,
} from './folder-tint-presets';

describe('folder-tint-presets', () => {
  it('treats null and empty as default swatch', () => {
    // Arrange
    const c0 = folderTintSwatchColour(null);
    const c1 = folderTintSwatchColour('');
    // Act & Assert
    expect(c0).toBe(c1);
    expect(c0).toMatch(/^oklch\(/);
  });

  it('returns expected swatch for blue', () => {
    // Act
    const c = folderTintSwatchColour('blue');
    // Assert
    expect(c).toContain('250');
  });

  it('treats unknown DB values as default', () => {
    // Act
    const c = folderTintSwatchColour('nope');
    const bg = folderTintRowBackground('nope');
    const opt = folderTintOptionForPersisted('nope');
    // Assert
    expect(c).toBe(folderTintSwatchColour(null));
    expect(bg).toBe(folderTintRowBackground(null));
    expect(opt.id).toBe('default');
  });

  it('returns non-transparent row background for green', () => {
    // Act
    const bg = folderTintRowBackground('green');
    // Assert
    expect(bg).not.toBe('transparent');
    expect(bg).toContain('color-mix');
  });

  it('folderHasPersistedTint is true only for valid DB tint keys', () => {
    // Assert
    expect(folderHasPersistedTint('blue')).toBe(true);
    expect(folderHasPersistedTint(null)).toBe(false);
    expect(folderHasPersistedTint('')).toBe(false);
    expect(folderHasPersistedTint('nope')).toBe(false);
  });
});
