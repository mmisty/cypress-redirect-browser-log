import { visitHtml } from '../test-helper/helper';
import { redirectTestLogs } from '../../src';

redirectTestLogs({
  isLogCommandDetails: true,
});

describe('test integration', () => {
  it('should log test details', () => {
    visitHtml();
    cy.get('div').should('exist');
  });
});
