import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'release', 'playwright-report', 'test-results', 'coverage', 'android'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser, parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: { ...js.configs.recommended.rules, ...reactHooks.configs.recommended.rules, 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }], 'react-refresh/only-export-components': 'off' },
  },
  { files: ['tests/**/*.{js,mjs}', 'playwright.config.js', 'electron/scripts/**/*.mjs'], languageOptions: { globals: { ...globals.node } } },
  { files: ['electron/main/**/*.cjs', 'electron/preload/**/*.cjs'], languageOptions: { globals: { ...globals.node }, sourceType: 'commonjs' } },
]
