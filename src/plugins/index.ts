import type { Runtime } from 'inspector';
import Browser = Cypress.Browser;
import BeforeBrowserLaunchOptions = Cypress.BeforeBrowserLaunchOptions;
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
  browserLaunchOptions: BeforeBrowserLaunchOptions,
) => Promise<BeforeBrowserLaunchOptions>;

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

const defaultListenersRegister: (keyof ConsoleEvents)[] = ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];

type EventHandler = (eventEmitter: TypedEventEmitter<ConsoleEvents>) => void;

/**
 * Register redirection with default events ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];
 * @param on Cypress.PluginEvents
 * @param cyConfig Cypress.PluginConfigOptions
 * @example
 * redirectLog(on, config);
 */
export function redirectLog(on: Cypress.PluginEvents, cyConfig: Cypress.PluginConfigOptions): void;

/**
 * Register redirection with specified events and with user handler
 * @param on Cypress.PluginEvents
 * @param cyConfig Cypress.PluginConfigOptions
 * @param logs array of events to log ex. ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];
 * @example
 * redirectLog(on, config, ['exception', 'test:log'])
 */
export function redirectLog(
  on: Cypress.PluginEvents,
  cyConfig: Cypress.PluginConfigOptions,
  logs: (keyof ConsoleEvents)[],
): void;

/**
 * Register redirection with overriding default events specified within user handler
 * @param on Cypress.PluginEvents
 * @param cyConfig Cypress.PluginConfigOptions
 * @param handler user handler
 * @example
 * redirectLog(on, config, handler => {
 *  handler.on('exception', (res) => {
 *     // can also write to file
 *     console.log(res)
 *   });
 * });
 */
export function redirectLog(
  on: Cypress.PluginEvents,
  cyConfig: Cypress.PluginConfigOptions,
  handler: EventHandler,
): void;

/**
 * Register redirection with specified events and with user handler
 * @param on Cypress.PluginEvents
 * @param cyConfig Cypress.PluginConfigOptions
 * @param logs array of events to log ex. ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];
 * @param handler user handler
 * @example
 * redirectLog(on, config, ['test:log'], handler => {
 *  handler.on('exception', (res) => {
 *     // can also write to file
 *     console.log(res)
 *   });
 * });
 * // disable default
 * redirectLog(on, config, [], handler => {
 *  handler.on('exception', (res) => {
 *     // can also write to file
 *     console.log(res)
 *   });
 * });
 */
export function redirectLog(
  on: Cypress.PluginEvents,
  cyConfig: Cypress.PluginConfigOptions,
  logs: (keyof ConsoleEvents)[],
  handler: EventHandler,
): void;

export function redirectLog(...args: unknown[]) {
  const on = args[0] as Cypress.PluginEvents;
  const cyConfig = args[1] as Cypress.PluginConfigOptions;
  let logs = defaultListenersRegister;
  let handler: EventHandler | undefined = undefined;

  if (args.length === 3) {
    if (Array.isArray(args[2])) {
      logs = args[2];
    } else {
      logs = defaultListenersRegister; // default log events
      handler = args[2] as EventHandler;
    }
  }

  if (args.length === 4) {
    logs = args[2] as (keyof ConsoleEvents)[];
    handler = args[3] as EventHandler;
  }

  const res = redirectLogBase(cyConfig, { defaultListeners: logs }, handler);
  res.beforeBrowserLaunch(on);
}

type BrowserHandler = (
  browser: Browser,
  browserLaunchOptions: BeforeBrowserLaunchOptions,
) => Promise<BeforeBrowserLaunchOptions>;

/**
 * Register redirection with default events ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];
 * @param cyConfig Cypress.PluginConfigOptions
 * @returns browserHandler
 * @example
 * const browserHandler = redirectLogBrowser(config);
 *
 * on('before:browser:launch', (browser, opts) => {
 *         return browserHandler(browser, opts);
 *  });
 */
export function redirectLogBrowser(cyConfig: Cypress.PluginConfigOptions): BrowserHandler;

/**
 * Register redirection with specified events;
 * @param cyConfig Cypress.PluginConfigOptions
 * @param logs array of events to log ex. ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];
 * @returns browserHandler
 * @example
 * const browserHandler = redirectLogBrowser(config, ['exception']);
 *
 * on('before:browser:launch', (browser, opts) => {
 *         return browserHandler(browser, opts);
 *  });
 */
export function redirectLogBrowser(
  cyConfig: Cypress.PluginConfigOptions,
  logs: (keyof ConsoleEvents)[],
): BrowserHandler;

/**
 * Register redirection only with specified events within user handler
 * @param cyConfig Cypress.PluginConfigOptions
 * @param handler user handler for events
 * @returns browserHandler
 * @example
 * const browserHandler = redirectLogBrowser(config, handler => {
 *   handler.on('exception', (res) => {
 *     // can write to file for example
 *     console.log(res)
 *   });
 * });
 *
 * on('before:browser:launch', (browser, opts) => {
 *         return browserHandler(browser, opts);
 *  });
 */
export function redirectLogBrowser(cyConfig: Cypress.PluginConfigOptions, handler: EventHandler): BrowserHandler;

/**
 * Register redirection with specified events and user handler
 * @param cyConfig Cypress.PluginConfigOptions
 * @param logs array of events to log ex. ['exception', 'error', 'warn', 'log', 'debug', 'test:log'];
 * @param handler user handler for events
 * @returns browserHandler
 * @example
 * const browserHandler = redirectLogBrowser(config, ['test:log'], handler => {
 *   handler.on('exception', (res) => {
 *     // can write to file for example
 *     console.log(res)
 *   });
 * });
 *
 * on('before:browser:launch', (browser, opts) => {
 *         return browserHandler(browser, opts);
 *  });
 */
export function redirectLogBrowser(
  cyConfig: Cypress.PluginConfigOptions,
  logs: (keyof ConsoleEvents)[],
  handler: EventHandler,
): BrowserHandler;

export function redirectLogBrowser(...args: unknown[]): BrowserHandler {
  const cyConfig = args[0] as Cypress.PluginConfigOptions;
  let logs = defaultListenersRegister;
  let handler: EventHandler | undefined = undefined;

  if (args.length === 2) {
    if (Array.isArray(args[1])) {
      logs = args[1];
    } else {
      logs = defaultListenersRegister; // default log events
      handler = args[1] as EventHandler;
    }
  }

  if (args.length === 3) {
    logs = Array.isArray(args[1]) ? args[1] : [];
    handler = args[2] as EventHandler;
  }

  return redirectLogBase(cyConfig, { defaultListeners: logs }, handler).browserLaunchHandler();
}

const redirectLogBase = (
  cyConfig: Cypress.PluginConfigOptions,
  config: Config,
  handler?: (eventEmitter: TypedEventEmitter<ConsoleEvents>) => void,
) => {
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
        async (
          browser: Browser,
          browserLaunchOptions: BeforeBrowserLaunchOptions,
        ): Promise<BeforeBrowserLaunchOptions> => {
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
    async (browser: Browser, browserLaunchOptions: BeforeBrowserLaunchOptions): Promise<BeforeBrowserLaunchOptions> => {
      const args = browserLaunchOptions.args || browserLaunchOptions;

      if (!isChrome(browser)) {
        log(`Warning: An unsupported browser family was used, output will not be logged to console: ${browser.family}`);

        return Promise.resolve(browserLaunchOptions);
      }

      const anyConsoleEvent = transform(eventEmitter);
      const rdp = ensureRdpPort(args);
      const interval = 100;
      const attempts = parseInt(`${cyConfig.env['BROWSER_CONNECT_TIMEOUT'] ?? timeout}`) / interval;

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

    on('before:browser:launch', (browser: Browser, browserLaunchOptions: BeforeBrowserLaunchOptions) => {
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
