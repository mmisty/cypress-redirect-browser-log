import type { Runtime } from 'inspector';
import type { LogType } from '../../logging/log.types';
import { stringifyStack } from '../../utils/string-utils';
import { dateWithCatch } from '../../utils/functions';

export type BrowserEntryRes = {
  logType: LogType;
  source: 'browser';
  timestamp: number;
  date: string;
  message: string;
  stack?: string | undefined;
};

export type LogEntry = {
  text: string;
  level: string;
  timestamp: number;
  url: string;
  stackTrace?: Runtime.StackTrace;
  lineNumber?: number;
};

export function isBrowserLogEntry(obj: unknown): obj is LogEntry {
  return !!obj && typeof obj === 'object' && Object.getOwnPropertyNames(obj).includes('entry');
}

export const getBrowserRes = (browserLog: LogEntry): BrowserEntryRes => {
  const logType = browserLog.level as LogType;
  const { timestamp, text, stackTrace } = browserLog;

  const stack = ['warning', 'error'].includes(logType) ? stringifyStack(stackTrace?.callFrames) : undefined;

  return {
    logType,
    source: 'browser',
    timestamp,
    date: dateWithCatch(timestamp),
    message: `${text}`,
    stack,
  };
};
