import type { Runtime } from 'inspector';
import Browser = Cypress.Browser;
import BrowserLaunchOptions = Cypress.BrowserLaunchOptions;
import { stringifyWithCatch } from '../utils/json-utils';
import { type ConsoleEvents, TypedEventEmitter } from './event-emitter';
import { getExceptionDetails, isRuntimeException } from './converters/exception';
import { getBrowserRes, isBrowserLogEntry, type LogEntry } from './converters/browser-log';
import { getConsoleRes, isConsoleApi } from './converters/console-log';
import { defaultHandlers } from './default-handlers';
import type { LogType } from '../logging/log.types';
import { PACK_NAME } from './pack';

export type Config = {
  defaultListeners: Array<keyof ConsoleEvents>;
};

type BrowserLaunchHandlerType = (
  browser: Browser,
  browserLaunchOptions: BrowserLaunchOptions,
) => Promise<BrowserLaunchOptions>;

function isChrome(browser) {
  return (
    browser.family === 'chrome' ||
    ['chrome', 'chromium', 'canary'].includes(browser.name) ||
    (browser.family === 'chromium' && browser.name !== 'electron')
  );
}

function log(msg) {
  console.log(`[${PACK_NAME}] ${msg}`);
}

function debugLog(msg) {
  // debug logs when DEBUG=cypress-redirect-browser-log
  if (process.env.DEBUG && process.env.DEBUG.includes(PACK_NAME)) {
    log(msg);
  }
}

function ensureRdpPort(args) {
  const existing = args.find(arg => arg.slice(0, 23) === '--remote-debugging-port');

  if (existing) {
    debugLog(`existing port: ${existing}`);

    return Number(existing.split('=')[1]);
  }

  const port = 40000 + Math.round(Math.random() * 25000);
  args.push(`--remote-debugging-port=${port}`);
  debugLog(`new port: ${port}`);

  return port;
}

export const transform =
  (eventListener: TypedEventEmitter<ConsoleEvents>) =>
  (params: Runtime.ConsoleAPICalledEventDataType | Runtime.ExceptionThrownEventDataType | { entry: LogEntry }) => {
    if (isRuntimeException(params)) {
      const res = getExceptionDetails(params);
      eventListener.emit('exception', res);

      return;
    }

    if (isConsoleApi(params)) {
      const res = getConsoleRes(params);

      if (!res) {
        log(`NOT A CONSOLE API EVENT: -------\n${stringifyWithCatch(params) || ''}\n`);

        return;
      }

      if (res.source === 'console:test') {
        eventListener.emit('test:log', res);
      } else {
        const ce = getConsoleEventsFromType(res.logType);

        if (ce) {
          eventListener.emit(ce, res);
        }
      }

      return;
    }

    if (isBrowserLogEntry(params)) {
      const res = getBrowserRes(params.entry);
      const ce = getConsoleEventsFromType(res.logType);

      if (ce) {
        eventListener.emit(ce, res);
      }

      return;
    }

    log('Unknown EVENT: -------\n');
    log(stringifyWithCatch(params));
  };

const getConsoleEventsFromType = (type: LogType): keyof ConsoleEvents | undefined => {
  switch (type) {
    case 'debug': {
      return 'debug';
    }

    case 'warning': {
      return 'warn';
    }

    case 'error': {
      return 'error';
    }

    case 'log': {
      return 'log';
    }

    default: {
      return undefined;
    }
  }
};

export const redirectLog = (
  cyConfig: Cypress.PluginConfigOptions,
  config: Config,
  handler?: (eventEmitter: TypedEventEmitter<ConsoleEvents>) => void,
) => {
  const defaultListenersRegister: (keyof ConsoleEvents)[] = ['exception', 'error', 'warn', 'log', 'test:log'];
  const { defaultListeners } = config ?? { defaultListeners: defaultListenersRegister };
  const isLog = cyConfig.env['REDIRECT_BROWSER_LOG'] === 'true' || cyConfig.env['REDIRECT_BROWSER_LOG'] === true;
  const eventEmitter = new TypedEventEmitter();

  if (!isLog) {
    log('Logging from browser is off, to turn on set REDIRECT_BROWSER_LOG environment variable to true');

    return {
      beforeBrowserLaunch: () => {
        // ignore sicne no logging
      },
      browserLaunchHandler:
        (): BrowserLaunchHandlerType =>
        async (browser: Browser, browserLaunchOptions: BrowserLaunchOptions): Promise<BrowserLaunchOptions> => {
          return Promise.resolve(browserLaunchOptions);
        },
    };
  }
  log('Logging from browser is on, to turn off set REDIRECT_BROWSER_LOG environment variable to false');
  // register event handler from user
  handler?.(eventEmitter);

  const existingEvents = eventEmitter.eventNames();

  // register empty error handler
  eventEmitter.on('error', () => {
    // ignore, otherwise throws
  });

  const events = defaultListeners.filter(y => !existingEvents.some(x => x.toString().indexOf(y) !== -1));

  if (events.length > 0) {
    debugLog(`Registering default console event handlers: ${events.join(', ')}`);
    events.forEach(defaultListnr => {
      defaultHandlers(defaultListnr, eventEmitter);
    });
  }

  const browserLaunchHandler =
    (timeout = 60000): BrowserLaunchHandlerType =>
    async (browser: Browser, browserLaunchOptions: BrowserLaunchOptions): Promise<BrowserLaunchOptions> => {
      const args = browserLaunchOptions.args || browserLaunchOptions;

      if (!isChrome(browser)) {
        log(`Warning: An unsupported browser family was used, output will not be logged to console: ${browser.family}`);

        return Promise.resolve(browserLaunchOptions);
      }

      const anyConsoleEvent = transform(eventEmitter);
      const rdp = ensureRdpPort(args);
      const interval = 100;
      const attempts = timeout / interval;

      const CDP = require('chrome-remote-interface');
      let attempt = 1;

      const tryConnect = async () => {
        if (attempt === 1) {
          debugLog('Attempting to connect to Chrome Debugging Protocol');
        }

        try {
          const client = await new CDP({ port: rdp });
          debugLog(`Connected to Chrome Debugging Protocol from ${attempt} attempt`);

          /** captures logs from the browser */
          client.Log.enable();
          client.Log.entryAdded(anyConsoleEvent);

          /** captures logs from console.X calls */
          client.Runtime.enable();
          client.Runtime.consoleAPICalled(anyConsoleEvent);
          client.Runtime.exceptionThrown(anyConsoleEvent);

          client.on('disconnect', async () => {
            attempt = 1;
            debugLog('Chrome Debugging Protocol disconnected');
            await tryConnect();
          });
        } catch (err) {
          attempt++;

          if (attempt < attempts) {
            setTimeout(tryConnect, interval);
          } else {
            debugLog(`Could not connect to Debugging Protocol after ${attempts} attempts`);
            debugLog(`Error: ${(err as Error).message}`);
          }
        }
      };

      await tryConnect();

      return browserLaunchOptions;
    };

  const beforeBrowserLaunch = (on: Cypress.PluginEvents) => {
    const browserHandler = browserLaunchHandler();

    on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
      return browserHandler(browser, browserLaunchOptions);
    });
  };

  return {
    /**
     * when there more things to do in 'before:browser:launch'
     */
    browserLaunchHandler,

    /**
     * when no need to do anything else with 'before:browser:launch'
     */
    beforeBrowserLaunch,
  };
};
