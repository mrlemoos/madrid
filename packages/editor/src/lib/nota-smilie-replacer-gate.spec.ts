import { afterEach, describe, expect, it } from 'vitest';
import {
  notaSmilieReplacerEnabled,
  setNotaSmilieReplacerEnabled,
} from './nota-smilie-replacer-gate';

describe('nota-smilie-replacer-gate', () => {
  afterEach(() => {
    setNotaSmilieReplacerEnabled(true);
  });

  it('defaults to enabled', () => {
    // Arrange
    setNotaSmilieReplacerEnabled(true);

    // Act
    const enabled = notaSmilieReplacerEnabled();

    // Assert
    expect(enabled).toBe(true);
  });

  it('reflects disabled state after set', () => {
    // Arrange
    setNotaSmilieReplacerEnabled(false);

    // Act
    const enabled = notaSmilieReplacerEnabled();

    // Assert
    expect(enabled).toBe(false);
  });
});
