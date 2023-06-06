import type { Runtime } from 'inspector';
import { logTest, TestLogEntry } from './test-log';
import { stringifyWithCatch, tryParseJson } from '../../utils/json-utils';
import { stringifyStack } from '../../utils/string-utils';
import type { LogTestType, LogType } from '../../logging/log.types';

export type LogEntryRes = {
  source: 'console';
  timestamp: number;
  date: string;
  message: string;
  fullMessage: string;
  stack?: string;
  logType: LogType;
};

export function isConsoleApi(obj: unknown): obj is Runtime.ConsoleAPICalledEventDataType {
  return !!obj && typeof obj === 'object' && Object.getOwnPropertyNames(obj).includes('args');
}

const convertToTestLog = (message: string | undefined): LogTestType | null => {
  if (!message) {
    return null;
  }

  const log = tryParseJson<LogTestType | null>(message);

  if (log && typeof log === 'object' && Object.getOwnPropertyNames(log).includes('log') && log.log === 'test') {
    const { details } = log;

    if (typeof details === 'string') {
      const newDetails = tryParseJson<unknown | null>(details);

      return {
        ...log,
        details: newDetails ?? log.details,
      };
    }

    return log;
  }

  return null;
};

const isUncaughtError = (message: string) => {
  type ErrorType = { Event: string; Error: unknown };

  const error = tryParseJson<ErrorType>(message);

  return error && !!error.Event && Object.getOwnPropertyNames(error).includes('Error');
};

const getLogType = (msg: string, eventType: string): LogType => {
  if (isUncaughtError(msg) || eventType === 'error') {
    return 'error';
  }

  if (eventType === 'warning') {
    return 'warning';
  }

  if (eventType === 'debug') {
    return 'debug';
  }

  return 'log';
};

export const getConsoleRes = (
  params: Runtime.ConsoleAPICalledEventDataType,
): TestLogEntry | LogEntryRes | undefined => {
  const { timestamp, type, stackTrace } = params;

  for (const arg of params.args) {
    const { value } = arg;
    const testLog = convertToTestLog(value);

    if (testLog) {
      return logTest(testLog, timestamp);
    }

    const logType = getLogType(value, type);

    const stack = ['warning', 'error'].includes(logType) ? stringifyStack(stackTrace?.callFrames) : undefined;

    return {
      source: 'console',
      timestamp: timestamp,
      date: new Date(timestamp).toISOString(),
      message: `${value ?? `<No message parsed> ${stringifyWithCatch(arg)}`}`,
      fullMessage: stringifyWithCatch(arg),
      logType,
      // uncaught error or console.warn, console.error
      // todos stack more friendly
      stack,
    };
  }

  return undefined;
};
