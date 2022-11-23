import type { Runtime } from 'inspector';
import type { LogTestType } from '../logging/log.types';
import { stringifyWithCatch, tryParseJson } from '../utils/json-utils';
import { appendMultiline, stringifyStack } from '../utils/string-utils';

type LogType = 'error' | 'warning' | 'log' | 'info' | 'debug' | 'trace' | 'test';
export type LogEntry = {
  text: string;
  level: string;
  timestamp: number;
  url: string;
  stackTrace: Runtime.StackTrace;
  lineNumber?: number;
};

// Console Api, change to logger in the future
const localConsole = console;

const warn = (message: unknown) => {
  localConsole.warn(message);
};

const consoleApi = (obj: unknown): Runtime.ConsoleAPICalledEventDataType | null => {
  if (obj && typeof obj === 'object' && Object.getOwnPropertyNames(obj).includes('args')) {
    return obj as Runtime.ConsoleAPICalledEventDataType;
  }

  return null;
};

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

const browserLogEntry = (obj: unknown): LogEntry | null => {
  if (obj && typeof obj === 'object' && Object.getOwnPropertyNames(obj).includes('text')) {
    return obj as LogEntry;
  }

  return null;
};

const isUncaughtError = (message: string) => {
  type ErrorType = { Event: string; Error: unknown };

  const error = tryParseJson<ErrorType>(message);

  return error && !!error.Event && Object.getOwnPropertyNames(error).includes('Error');
};

const logConsole = (message = '', options?: { logType: LogType; addition?: string }) => {
  const log = (msg: string, logType?: LogType) => {
    const type = logType ?? 'log';

    switch (type) {
      case 'error': {
        localConsole.error(`${msg}`);
        break;
      }

      case 'warning': {
        localConsole.warn(msg);
        break;
      }

      case 'debug': {
        localConsole.debug(msg);
        break;
      }

      default: {
        localConsole.log(msg);
      }
    }
  };

  log(appendMultiline(`FROM CHROME >> ${options?.addition ?? ''}`, message), options?.logType);
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

const logStack = (additionStr: string, logType: LogType, stackTrace: Runtime.StackTrace | undefined) => {
  logConsole('STACK:', { addition: additionStr, logType });
  const addition = `${additionStr}${' '.repeat(4)}`;

  logConsole(`${stringifyStack(stackTrace?.callFrames)}`, {
    addition,
    logType,
  });
};

const isErrorOrWarn = (lt: LogType) => ['warning', 'error'].includes(lt);

const logBrowser = (event: { type: string } & unknown, additionFn: (date: number, logtype: LogType) => string) => {
  const browserLog = browserLogEntry(event);

  if (!browserLog) {
    warn(`NOT A browserLog EVENT: -------\n${stringifyWithCatch(event) || ''}`);

    return;
  }

  const logType = browserLog.level as LogType;
  const addition = additionFn(browserLog.timestamp, logType);

  logConsole(`${browserLog.text}`, { addition, logType });

  if (isErrorOrWarn(logType)) {
    logStack(addition, logType, browserLog.stackTrace);
  }
};

const logTest = (testLog: LogTestType, additionFn: (logtype: LogType) => string) => {
  const { logType } = testLog;

  const messageCmd = testLog.command ? `command: ${testLog.command}` : '';
  const messageMsg = testLog.message ?? '';
  const messageDetails = testLog.details ? `, details: ${stringifyWithCatch(testLog.details)}` : '';
  const addition = additionFn(logType);

  logConsole(`${messageCmd}${messageCmd && testLog.message ? ' -> ' : ''}${messageMsg}${messageDetails}`, {
    addition,
    logType,
  });
};

const logConsoleApi = (event: { type: string } & unknown, additionFn: (date: number, logtype: LogType) => string) => {
  const api = consoleApi(event);

  if (!api) {
    warn(`NOT A CONSOLE API EVENT: -------\n${stringifyWithCatch(event) || ''}`);

    return;
  }

  api.args.forEach(t => {
    const testLog = convertToTestLog(t.value);

    if (testLog) {
      logTest(testLog, (lt: LogType) => additionFn(api.timestamp, lt));

      return;
    }

    const logType = getLogType(t.value, event.type);
    const addition = additionFn(api.timestamp, logType);

    const noMsg = `<No message parsed> Log object: ${stringifyWithCatch(t)}`;

    logConsole(`${t.value ?? noMsg}`, {
      addition,
      logType,
    });

    // uncaught error or console.warn, console.error
    // todos stack more friendly
    if (isErrorOrWarn(logType)) {
      logStack(addition, logType, api.stackTrace);
    }
  });
};

const additionStrFn = (date: number, lt: LogType) => {
  const logTypeStr = String(`    ${lt}`).slice(-7);

  return `${new Date(date).toISOString()} | ${logTypeStr} | `;
};

export const filterFunc = (isLog: boolean) => (type: string, event: { type: string } & unknown): boolean => {
  // return true or false from this plugin to control if the event is logged
  // `type` is either `console` or `browser`
  // if `type` is `browser`, `event` is an object of the type `LogEntry`:
  //  https://chromedevtools.github.io/devtools-protocol/tot/Log#type-LogEntry
  // if `type` is `console`, `event` is an object of the type passed to `Runtime.consoleAPICalled`:
  //  https://chromedevtools.github.io/devtools-protocol/tot/Runtime#event-consoleAPICalled

  // this executes on every entry

  if (!isLog) {
    return false;
  }

  switch (type) {
    case 'console': {
      logConsoleApi(event, additionStrFn);
      break;
    }

    case 'browser': {
      logBrowser(event, additionStrFn);

      break;
    }

    default: {
      warn(`UNKNOWN LOG TYPE: ${type}`);
      warn(event);
      break;
    }
  }

  return false;
};
