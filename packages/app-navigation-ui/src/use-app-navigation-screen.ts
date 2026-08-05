import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  parseScreenFromPath,
  type AppNavScreen,
} from '@nota/app-navigation-core/navigation';

/**
 * Active workspace screen derived from the Next App Router pathname. `usePathname`
 * re-renders on every client navigation (including the `history.pushState` from the
 * imperative nav helpers, which Next intercepts) — no manual subscribe needed.
 */
export function useAppNavigationScreen(): AppNavScreen {
  const pathname = usePathname();
  return useMemo(() => parseScreenFromPath(pathname), [pathname]);
}
