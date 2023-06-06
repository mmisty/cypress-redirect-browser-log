export type LogTestType = {
  log: 'test';
  logType: 'test' | 'error';
  command?: string;
  message?: string;
  details?: unknown;
};

export type LogType = 'error' | 'warning' | 'log' | 'info' | 'debug' | 'trace' | 'test' | 'UNCAUGHT';
