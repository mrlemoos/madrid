import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.mjs';
import { notaReactStrictRules } from '../../tools/eslint-react-strict.mjs';

const tsconfigRootDir = import.meta.dirname;

export default [
  {
    ignores: [
      'postcss.config.cjs',
      'eslint.config.mjs',
      'scripts/**/*.mjs',
      // Next build output + tsc emit — generated, never linted.
      '.next/**',
      'out-tsc/**',
    ],
  },
  ...baseConfig,
  ...nx.configs['flat/react'],
  notaReactStrictRules,
  {
    files: ['src/lib/*.mjs'],
    languageOptions: {
      parserOptions: { tsconfigRootDir },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.{spec,test}.{ts,tsx}', '**/vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    // `src/server/**` is the absorbed nota-server code — it runs only in Node
    // route handlers, so Clerk backend / service-role usage is expected there.
    ignores: ['src/server/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@clerk/backend',
              message:
                'Clerk backend is server-only; import it from src/server/ modules.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.ts', 'vite-stubs/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Tests + Vitest config live in tsconfig.spec.json, not the Next `tsconfig.json`
    // program eslint's project service uses; disable type-aware rules so they don't
    // trip "not found by the project service".
    files: [
      '**/*.{spec,test}.{ts,tsx}',
      'vitest.setup.ts',
      'vitest.config.ts',
      'next.config.ts',
    ],
    ...tseslint.configs.disableTypeChecked,
  },
];
