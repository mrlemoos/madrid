import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['**/out-tsc'],
  },
  ...nx.configs['flat/react'],
  ...baseConfig,
];
