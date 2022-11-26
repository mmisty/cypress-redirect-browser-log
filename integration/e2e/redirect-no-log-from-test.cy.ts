import { visitHtml } from '../test-helper/helper';
import { redirectLogsBrowser } from 'cy-local';

redirectLogsBrowser({
  isLogFromTest: false,
});

describe('test integration', () => {
  it('should be no commands in log', () => {
    visitHtml();
    cy.get('div').should('be.visible');
  });
});
