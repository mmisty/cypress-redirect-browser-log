import { visitHtml } from '../test-helper/helper';
import { redirectLogsBrowser } from '../../src';

redirectLogsBrowser({
  isLogFromTest: true,
  isLogCommandDetails: true,
});

describe('test integration', () => {
  it('should log test details', () => {
    visitHtml();
    cy.get('div').should('exist');
  });
});
