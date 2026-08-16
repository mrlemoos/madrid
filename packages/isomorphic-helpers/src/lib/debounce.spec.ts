import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes the callback once after trailing quiet period', () => {
    // Arrange
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Act
    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(99);
    debounced('c');
    vi.advanceTimersByTime(100);

    // Assert
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('does not invoke before the wait elapses', () => {
    // Arrange
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Act
    debounced();
    vi.advanceTimersByTime(50);

    // Assert
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel drops a pending invocation', () => {
    // Arrange
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Act
    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(200);

    // Assert
    expect(fn).not.toHaveBeenCalled();
  });

  it('flush invokes the pending callback immediately', () => {
    // Arrange
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Act
    debounced('x');
    debounced.flush();

    // Assert
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('x');

    // Act
    vi.advanceTimersByTime(200);

    // Assert
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('flush is a no-op when nothing is pending', () => {
    // Arrange
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Act
    debounced.flush();

    // Assert
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes the latest arguments to the callback', () => {
    // Arrange
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    // Act
    debounced(1, 'one');
    debounced(2, 'two');
    vi.advanceTimersByTime(100);

    // Assert
    expect(fn).toHaveBeenCalledWith(2, 'two');
  });
});
