import { visitHtml } from '../test-helper/helper';
import { redirectLogsBrowser } from 'cy-local';

redirectLogsBrowser({
  isLogFromTest: {
    isLogCommandDetails: false,
  },
});

describe('test integration', () => {
  it('should be no details for commands', () => {
    visitHtml();
    cy.get('div').should('exist');
  });
});
