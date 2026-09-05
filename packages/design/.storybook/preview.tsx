import * as React from 'react';
import type { Preview } from '@storybook/react-vite';

import './preview.css';

/**
 * `@getmadrid/design` reads light / dark from `html.light` / `html.dark` (see `src/lib/theme.tsx`),
 * so the toolbar toggle just stamps the class instead of pulling in an addon.
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Madrid colour scheme',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      React.useLayoutEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
      }, [theme]);
      return <Story />;
    },
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
