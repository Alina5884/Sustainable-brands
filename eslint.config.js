module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      eqeqeq: 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    },
  },
];
