import { parseBoolean } from '../../src/utils/functions';

export const setupCoverage = () => {
  if (parseBoolean(Cypress.env('COVERAGE'))) {
    require('@cypress/code-coverage/support');
  } else {
    console.warn('COVERAGE NOT ENABLED IN BROWSER');
  }
};
