import { describe, expect, it } from 'vitest';
import {
  AUTH_CARD_ORIGIN_KEY,
  authCardInvertTransform,
  captureAuthCardOrigin,
  forgetAuthCardOrigin,
  takeAuthCardOrigin,
  type AuthCardOriginStore,
} from './auth-card-origin';

function memoryStore(
  initial: Record<string, string> = {},
): AuthCardOriginStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('auth card origin', () => {
  it('inverts the card from the button box toward its rest box', () => {
    // Arrange
    const origin = {
      top: 200,
      left: 100,
      width: 50,
      height: 40,
      radius: 8,
      at: 0,
    };
    const last = { top: 20, left: 10, width: 100, height: 80 };

    // Act
    const invert = authCardInvertTransform(origin, last);

    // Assert
    expect(invert).toEqual({
      translateX: 90,
      translateY: 180,
      scaleX: 0.5,
      scaleY: 0.5,
    });
  });

  it('stores the trigger box and yields it once', () => {
    // Arrange
    const store = memoryStore();
    const trigger = {
      getBoundingClientRect: () => ({
        top: 12,
        left: 24,
        width: 160,
        height: 40,
      }),
    } as unknown as Element;
    Object.defineProperty(trigger, 'ownerDocument', {
      value: {
        defaultView: {
          getComputedStyle: () => ({ borderTopLeftRadius: '10px' }),
        },
      },
    });

    // Act
    captureAuthCardOrigin(trigger, store, 1_000);
    const first = takeAuthCardOrigin(store, 1_100);
    const second = takeAuthCardOrigin(store, 1_100);
    forgetAuthCardOrigin();
    const third = takeAuthCardOrigin(store, 1_100);

    // Assert
    expect(first).toEqual({
      top: 12,
      left: 24,
      width: 160,
      height: 40,
      radius: 10,
      at: 1_000,
    });
    expect(second).toEqual(first);
    expect(third).toBeNull();
    expect(store.getItem(AUTH_CARD_ORIGIN_KEY)).toBeNull();
  });

  it('ignores an origin that is too old to belong to this navigation', () => {
    // Arrange
    const store = memoryStore({
      [AUTH_CARD_ORIGIN_KEY]: JSON.stringify({
        top: 1,
        left: 1,
        width: 10,
        height: 10,
        radius: 4,
        at: 0,
      }),
    });

    // Act
    const origin = takeAuthCardOrigin(store, 10_000);

    // Assert
    expect(origin).toBeNull();
  });
});
