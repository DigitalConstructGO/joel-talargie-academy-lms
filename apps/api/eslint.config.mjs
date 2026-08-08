import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/modules/administration/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  { languageOptions: { globals: { ...globals.node, ...globals.jest } } },
);
