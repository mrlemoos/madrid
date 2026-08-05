import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useOrThrow } from '@nota/helper-hooks';

import {
  applySafariChromeBackground,
  applyThemeColorMeta,
  resolveThemePreference,
  type ResolvedTheme,
} from './theme-color.js';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  /** The children to render. */
  children: ReactNode;
  /**
   * The default theme to use if no theme is stored in localStorage (default: 'system').
   * @default 'system'
   */
  defaultTheme?: Theme;
  /**
   * The key to store the theme in localStorage (default: 'nota-ui-theme').
   * @default 'nota-ui-theme'
   */
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/** The context for the ThemeProvider. */
const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

/** The default key to store the theme in localStorage. */
const DEFAULT_STORAGE_KEY = 'nota-ui-theme';
/** The default theme to use if no theme is stored in localStorage. */
const DEFAULT_THEME = 'system' as const;

/**
 * A React component which provides the theme to the entire app.
 * There should be only **one** ThemeProvider in the app in the component tree.
 *
 * ## Usage
 *
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = DEFAULT_STORAGE_KEY,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = localStorage.getItem(storageKey);
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const applyResolved = (resolved: ResolvedTheme) => {
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      applyThemeColorMeta(resolved);
      applySafariChromeBackground(resolved);
    };

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystem = () => {
        applyResolved(resolveThemePreference('system', mql.matches));
      };

      applySystem();
      mql.addEventListener('change', applySystem);
      return () => {
        mql.removeEventListener('change', applySystem);
      };
    }

    applyResolved(resolveThemePreference(theme, false));
    return undefined;
  }, [theme]);

  return (
    <ThemeProviderContext
      {...props}
      value={useMemo(
        () => ({
          theme,
          setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
          },
        }),
        [theme, setTheme, storageKey],
      )}
    >
      {children}
    </ThemeProviderContext>
  );
}

export function useTheme() {
  return useOrThrow(
    ThemeProviderContext,
    'useTheme must be used within a ThemeProvider',
  );
}
