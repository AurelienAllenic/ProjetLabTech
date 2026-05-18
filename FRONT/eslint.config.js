import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Interdit tout usage de `any` explicite
      '@typescript-eslint/no-explicit-any': 'error',
      // Interdit les assertions de type non vérifiées
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Variables non utilisées (remplace la règle JS de base)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Imports cohérents
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // Autorise les exports mixtes (composant + constante) dans router.tsx
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // setState dans useEffect est valide pour initialiser depuis une source externe
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
