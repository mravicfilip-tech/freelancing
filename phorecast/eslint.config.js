// ESLint flat config.
//
//   npm run lint          everything: src, scripts and the config files
//   npx eslint src        just the app
//
// typescript-eslint's `recommended` set, not the type-checked one: it needs no
// program build, so a full run stays a few seconds. `npm run typecheck` is
// what checks types.
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default defineConfig(
  // m[A-Z]/ is gitignored agent scratch (see .gitignore): probes, not source.
  { ignores: ['dist', 'dist-*', 'node_modules', 'm[A-Z]/'] },

  js.configs.recommended,
  tseslint.configs.recommended,

  // The app: browser code, React components and hooks.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      // Fast refresh can only hot-swap a module that exports components and
      // nothing else. A mixed module still works; it reloads the page instead.
      // A warning, because it costs dev speed rather than correctness.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // `_name` marks a parameter kept for its position in a signature, which
      // is also what the compiler's noUnusedParameters (tsconfig.json) allows.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Node: the config files at the root, and the scripts. The scripts drive a
  // browser through playwright, and the callbacks they hand to
  // page.evaluate() run in the page, so they get the browser's globals too.
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
