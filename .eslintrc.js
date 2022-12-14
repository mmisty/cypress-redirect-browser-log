module.exports = {
  extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'eslint-config-prettier'],
  parser: '@typescript-eslint/parser',
  env: {
    es6: true,
    browser: false,
    node: true,
    commonjs: false,
    es2021: true,
  },
  plugins: ['prettier', '@typescript-eslint', 'promise'],
  ignorePatterns: ['*.yaml', '*.yml', '*.csv'],

  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-template': 'error',
    quotes: ['error', 'single', { avoidEscape: true }],
    '@typescript-eslint/no-var-requires': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': ['off', 'ForOfStatement'],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'all',
        semi: true,
        singleQuote: true,
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
        arrowParens: 'avoid',
      },
    ],
    '@typescript-eslint/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'func-names': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'global-require': 'off',
    'no-param-reassign': 'off',
    'no-return-assign': 'off',
    'no-plusplus': 'off',
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: '*',
        next: ['class', 'function', 'return', 'try', 'switch'],
      },
      { blankLine: 'always', prev: 'import', next: '*' },
      { blankLine: 'never', prev: 'import', next: 'import' },
      {
        blankLine: 'always',
        prev: '*',
        next: ['multiline-block-like', 'multiline-const'],
      },
    ],
  },
};
