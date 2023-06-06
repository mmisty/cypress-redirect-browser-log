import type { LogTestType } from './log.types';
import { stringifyWithCatch } from '../utils/json-utils';

export const wrapLogs = (options: { isLogDetails?: boolean }): void => {
  const localConsole = console;
  const { isLogDetails } = options;

  Cypress.on('test:before:run', (testAttributes: Cypress.ObjectLike, test: Mocha.Test) => {
    const logObj = (): LogTestType => ({
      log: 'test',
      logType: 'test',

      command: undefined,
      message: `======== TEST STARTED: ${test.fullTitle()}`,
      details: undefined,
    });

    localConsole.log(JSON.stringify(logObj()));
  });

  Cypress.on('test:after:run', (_attributes: unknown, test: Mocha.Test) => {
    const testResult = () => {
      if (test.isPassed()) {
        return 'PASSED';
      }

      if (test.isFailed()) {
        return 'FAILED';
      }

      if (test.isPending()) {
        return 'PENDING';
      }

      return 'UNKNOWN';
    };

    const logObj = (): LogTestType => ({
      log: 'test',
      logType: test.isFailed() ? 'error' : 'test',

      command: undefined,
      message: `==== TEST RESULT: ${testResult()}`,
      details: test.err?.message,
    });

    localConsole.log(JSON.stringify(logObj()));
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Cypress.on('log:added', (log: Partial<Cypress.LogConfig>, _interactive: boolean) => {
    const { name, message = '', consoleProps = {} } = log;

    const overrideMessage = (msg: string, props: unknown): string => {
      if (name === 'assert' && props && typeof props === 'object') {
        const m = props as { Message: string };

        return m.Message ?? msg;
      }

      if (msg.match(/Object{\d+}/)) {
        return '';
      }

      return msg;
    };

    const details = () => {
      return stringifyWithCatch(consoleProps, false, 'Could not stringify details');
    };

    const logObj = (): LogTestType => ({
      log: 'test',
      logType: 'test',
      command: name,
      message: overrideMessage(message, consoleProps),
      details: isLogDetails ? details() : undefined,
    });

    localConsole.log(JSON.stringify(logObj()));
  });
};
