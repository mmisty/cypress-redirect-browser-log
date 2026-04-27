import { COVERAGE } from '../common/constants';

const setupCoverage = () => {
  if (`${Cypress.expose(COVERAGE)}` === 'true') {
    console.log('ENABLE COV');
    require('@cypress/code-coverage/support');
  } else {
    console.log('COVERAGE NOT ENABLED IN BROWSER');
  }
};

setupCoverage();
