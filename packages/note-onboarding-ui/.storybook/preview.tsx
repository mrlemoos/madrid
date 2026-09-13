import * as React from 'react';
import type { Preview } from '@storybook/react-vite';

import './preview.css';

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
  initialGlobals: { theme: 'dark' },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'light' ? 'light' : 'dark';
      React.useLayoutEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
      }, [theme]);
      return <Story />;
    },
  ],
};

export default preview;
