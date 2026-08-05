import { fireEvent, render, screen } from '@testing-library/react';
import { type JSX } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from './theme-color.js';
import { ThemeProvider, useTheme } from './theme.js';

type ChangeCallback = (event: { matches: boolean }) => void;

const STORAGE_KEY = 'nota-test-theme-system-mql';
let changeListeners: ChangeCallback[] = [];
const mqlState = { matches: false };

function firePrefersColorSchemeChange(): void {
  const snapshot = [...changeListeners];
  for (const cb of snapshot) {
    cb({ matches: mqlState.matches });
  }
}

function TestHarness(): JSX.Element {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => {
        setTheme('light');
      }}
    >
      force-light
    </button>
  );
}

describe('ThemeProvider (system + prefers-color-scheme)', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      clear: () => {
        storage.clear();
      },
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => [...storage.keys()][index] ?? null,
      get length() {
        return storage.size;
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    } satisfies Storage);

    changeListeners = [];
    mqlState.matches = false;
    storage.delete(STORAGE_KEY);
    document.documentElement.classList.remove('light', 'dark');

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        expect(query).toBe('(prefers-color-scheme: dark)');
        return {
          get matches() {
            return mqlState.matches;
          },
          media: query,
          addEventListener: (type: string, cb: EventListener) => {
            if (type === 'change') {
              changeListeners.push(cb as unknown as ChangeCallback);
            }
          },
          removeEventListener: (type: string, cb: EventListener) => {
            if (type === 'change') {
              changeListeners = changeListeners.filter(
                (l) => l !== (cb as unknown as ChangeCallback),
              );
            }
          },
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('light', 'dark');
    document.head
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((node) => {
        node.remove();
      });
  });

  function themeColorMeta(): HTMLMetaElement | null {
    return document.querySelector('meta[name="theme-color"]');
  }

  it('updates document class when prefers-color-scheme changes while theme is system', () => {
    // Arrange
    mqlState.matches = false;

    // Act
    render(
      <ThemeProvider defaultTheme="system" storageKey={STORAGE_KEY}>
        <span>child</span>
      </ThemeProvider>,
    );

    // Assert
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(themeColorMeta()?.content).toBe(THEME_COLOR_LIGHT);

    // Act
    mqlState.matches = true;
    firePrefersColorSchemeChange();

    // Assert
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(themeColorMeta()?.content).toBe(THEME_COLOR_DARK);
  });

  it('removes prefers-color-scheme listener when leaving system theme', () => {
    // Arrange
    mqlState.matches = false;

    // Act
    render(
      <ThemeProvider defaultTheme="system" storageKey={STORAGE_KEY}>
        <TestHarness />
      </ThemeProvider>,
    );

    expect(changeListeners.length).toBeGreaterThan(0);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'force-light' }));

    // Assert
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(changeListeners.length).toBe(0);

    // Act: stale system listener would flip to dark when matches is true
    mqlState.matches = true;
    firePrefersColorSchemeChange();

    // Assert
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
