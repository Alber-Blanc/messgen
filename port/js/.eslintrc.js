module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, es2022: true },
  parserOptions: { sourceType: 'module' },
  ignorePatterns: [
    'dist/',
    'coverage/',
    'tests/fixtures/',
    'tests/mynamespace/',
    'tests/types.*',
    'tests/protocols.*',
    'benchmarks/deserialize-variant/*.js',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};
