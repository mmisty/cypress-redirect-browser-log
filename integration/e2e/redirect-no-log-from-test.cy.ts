import { visitHtml } from '../test-helper/helper';
import { redirectTestLogs } from '../../src';

redirectTestLogs();

describe('test integration', () => {
  it('should be no commands in log', () => {
    visitHtml();
    cy.get('div').should('be.visible');
  });

  it('should be no commands in log', () => {
    visitHtml();
    cy.get('div').should('be.visible');
  });

  const html = (msg?: string) => `
    <html>
    <head></head>
    <script>${msg ? `throw Error("${msg}")` : ''}</script>
    <body>
        <div>Testing text</div>
    </body>
    </html>
    `;

  it('Should log uncaught exceptions', () => {
    cy.on('uncaught:exception', err => {
      if (err.message.indexOf('Special exception from code') !== -1) {
        return false;
      }

      throw err;
    });
    cy.intercept('mytest.com', { body: html('Special exception from code') });
    cy.visit('mytest.com');
  });
});
