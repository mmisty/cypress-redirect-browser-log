export type LogTestType = {
  log: 'test';
  logType: 'test' | 'error';
  command?: string;
  message?: string;
  details?: unknown;
};
