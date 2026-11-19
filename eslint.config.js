import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/engine/**/*.ts', 'src/modes/**/{reducer,generator,checker}.ts'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage', 'navigator'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded rng.' },
        { object: 'Date', property: 'now', message: 'Use the injected clock.' },
        { object: 'performance', property: 'now', message: 'Use the injected clock.' },
      ],
    },
  },
);
