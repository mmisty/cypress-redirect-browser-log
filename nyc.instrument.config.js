module.exports = {
  extends: '@istanbuljs/nyc-config-typescript',
  all: true,
  cache: false,
  include: ['src'],
  exclude: ['cypress-e2e', '*.types.ts', 'types.ts', '*.js'],
};
