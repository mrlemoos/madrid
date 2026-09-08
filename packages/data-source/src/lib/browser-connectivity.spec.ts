import { afterEach, describe, expect, it, vi } from 'vitest';

import { subscribeOnline } from './browser-connectivity';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('subscribeOnline', () => {
  it('calls every subscriber when the browser comes back online', () => {
    // Arrange
    const first = vi.fn();
    const second = vi.fn();
    const unsubFirst = subscribeOnline(first);
    const unsubSecond = subscribeOnline(second);

    // Act
    window.dispatchEvent(new Event('online'));

    // Assert
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    unsubFirst();
    unsubSecond();
  });

  it('attaches a single window listener no matter how many subscribers there are', () => {
    // Arrange
    const add = vi.spyOn(window, 'addEventListener');

    // Act
    const unsubFirst = subscribeOnline(vi.fn());
    const unsubSecond = subscribeOnline(vi.fn());

    // Assert
    expect(add.mock.calls.filter(([type]) => type === 'online')).toHaveLength(
      1,
    );
    unsubFirst();
    unsubSecond();
  });

  it('stops calling a subscriber once it unsubscribes', () => {
    // Arrange
    const listener = vi.fn();
    const unsubscribe = subscribeOnline(listener);

    // Act
    unsubscribe();
    window.dispatchEvent(new Event('online'));

    // Assert
    expect(listener).not.toHaveBeenCalled();
  });

  it('detaches the window listener once the last subscriber leaves', () => {
    // Arrange
    const remove = vi.spyOn(window, 'removeEventListener');
    const unsubFirst = subscribeOnline(vi.fn());
    const unsubSecond = subscribeOnline(vi.fn());

    // Act
    unsubFirst();
    const afterFirst = remove.mock.calls.filter(([t]) => t === 'online').length;
    unsubSecond();

    // Assert — only the last unsubscribe tears the shared listener down
    expect(afterFirst).toBe(0);
    expect(remove.mock.calls.filter(([t]) => t === 'online')).toHaveLength(1);
  });
});
