import { visitHtml } from '../test-helper/helper';
import { redirectTestLogs } from '../../src';

redirectTestLogs({
  isLogCommandDetails: false,
});

describe('test integration', () => {
  it('should be no details for commands', () => {
    visitHtml();
    cy.get('div').should('exist');
  });
});
