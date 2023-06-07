import type { LogTestType } from '../../logging/log.types';
import { stringifyWithCatch } from '../../utils/json-utils';
import { dateWithCatch } from '../../utils/functions';

export type TestLogEntry = {
  command: string;
  source: 'console:test';
  spec: Cypress.Spec;
  message: string;
  details: string;
  logType: string;
  timestamp: number;
  date: string;
};

export const logTest = (testLog: LogTestType, timestamp: number): TestLogEntry => {
  const { logType } = testLog;

  const messageCmd = testLog.command ? `${testLog.command}` : '';
  const messageMsg = testLog.message ?? '';

  const stringDetails = typeof testLog?.details === 'string' ? testLog.details : stringifyWithCatch(testLog.details);
  const messageDetails = testLog.details ? stringDetails : '';

  return {
    source: 'console:test',
    command: messageCmd,
    message: messageMsg,
    details: messageDetails,
    logType,
    timestamp,
    spec: testLog.spec,
    date: dateWithCatch(timestamp),
  };
};
