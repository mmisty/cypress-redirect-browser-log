import { visitHtml } from '../test-helper/helper';
import { redirectLogsBrowser } from 'cy-local';

redirectLogsBrowser({
  isLogFromTest: {
    isLogCommandDetails: true,
  },
});

describe('test integration', () => {
  it('should log test details', () => {
    visitHtml();
    cy.get('div').should('exist');
  });
});
