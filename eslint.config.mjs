import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['out/**', 'release/**', 'dist/**', '**/*.d.ts'] },
  tseslint.configs.recommended,
  {
    // Stylistic preference, not correctness - TypeScript already infers these reliably, and
    // requiring it retroactively across ~90 existing component functions isn't a pragmatic first
    // lint pass (see #8).
    rules: { '@typescript-eslint/explicit-function-return-type': 'off' }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      ...react.configs['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  eslintConfigPrettier
)
