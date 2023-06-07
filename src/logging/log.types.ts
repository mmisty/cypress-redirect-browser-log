export type LogTestType = {
  log: 'test';
  logType: 'test' | 'error';
  command?: string;
  spec: Cypress.Spec;
  message?: string;
  details?: unknown;
};

export type LogType = 'error' | 'warning' | 'log' | 'info' | 'debug' | 'trace' | 'test' | 'UNCAUGHT';
