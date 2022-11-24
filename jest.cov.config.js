// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: [
    '**/instrumented/**/(*.)+(spec|test).[t]s?(x)',
    '!**/cypress-e2e/**/*.(spec|test).ts',
    '!**/lib/**/*.*',
    '!**/src/**/*.*',
  ],
  // setup in nyc config
  coverageDirectory: undefined,
  collectCoverage: undefined,
  coverageProvider: undefined,
  collectCoverageFrom: undefined,
};
