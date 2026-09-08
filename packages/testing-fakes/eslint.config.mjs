import baseConfig from '../../eslint.config.mjs';

const tsconfigRootDir = import.meta.dirname;

export default [
  ...baseConfig,
  {
    ignores: ['**/out-tsc'],
  },
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir,
      },
    },
  },
];
