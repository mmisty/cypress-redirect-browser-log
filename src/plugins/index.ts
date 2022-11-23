import Browser = Cypress.Browser;
import BrowserLaunchOptions = Cypress.BrowserLaunchOptions;
import { stringifyWithCatch } from '../utils/json-utils';
import { filterFunc } from './filter';

export type Config = {
  isLog?: boolean;
  redirectToFileTest?: {
    logsPath: string;
  };
};

export const redirectLog = (config?: Config) => {
  const { isLog } = config ?? { isLog: true };
  const chalk = require('chalk');

  // input
  //  - out stream
  //  - filter

  const severityColors = {
    verbose: a => a,
    info: chalk.blue,
    warning: chalk.yellow,
    error: chalk.red,
  };

  const severityIcons = {
    verbose: ' ',
    info: '🛈',
    warning: '⚠',
    error: '⚠',
  };

  type Filter = (type: string, event: { type: string } & unknown) => boolean;

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
    console.log(msg);
  }

  function debugLog(msg) {
    // suppress with DEBUG=browser-log-to-output
    if (process.env.DEBUG && process.env.DEBUG.includes('browser-log-to-output')) {
      return;
    }

    log(`[browser-log-to-output] ${msg}`);
  }

  function ensureRdpPort(args) {
    const existing = args.find(arg => arg.slice(0, 23) === '--remote-debugging-port');

    if (existing) {
      debugLog(`existing port: ${existing}`);

      return Number(existing.split('=')[1]);
    }

    const port = 40000 + Math.round(Math.random() * 25000);
    args.push(`--remote-debugging-port=${port}`);
    log(`new port: ${port}`);

    return port;
  }

  const logConsole = (eventFilter?: Filter) => params => {
    if (eventFilter && !eventFilter('console', params)) {
      return;
    }

    const { type, args, timestamp } = params;
    const level = type === 'error' ? 'error' : 'verbose';
    const color = severityColors[level];
    const icon = severityIcons[level];

    const prefix = `[${new Date(timestamp).toISOString()}] ${icon} `;
    const prefixSpacer = ' '.repeat(prefix.length);

    const logMessage = `${prefix}${chalk.bold(`console.${type}`)} called`;

    log(color(([logMessage] as unknown) as TemplateStringsArray));
    // recordLogMessage(logMessage);

    const logAdditional = msg => {
      const logMsg = `${prefixSpacer}${msg}`;
      log(color(([logMsg] as unknown) as TemplateStringsArray));
      // recordLogMessage(logMessage);
    };

    if (args) {
      logAdditional('Arguments:');
      logAdditional(`  ${stringifyWithCatch(args, true).split('\n').join(`\n${prefixSpacer}  `).trimRight()}`);
    }
  };

  const logEntry = (eventFilter?: Filter) => params => {
    if (eventFilter && !eventFilter('browser', params.entry)) {
      return;
    }

    const { level, source, text, timestamp, url, lineNumber, stackTrace, args } = params.entry;
    let color = severityColors[level];

    if (typeof color !== 'function') {
      color = (msg: string) => msg;
    }
    const icon = severityIcons[level];

    const prefix = `[${new Date(timestamp).toISOString()}] ${icon} `;
    const prefixSpacer = ' '.repeat(prefix.length);

    const logMessage = `${prefix}${chalk.bold(level)} (${source}): ${text}`;
    log(color(logMessage));
    // recordLogMessage(logMessage);

    const logAdditional = msg => {
      const additionalLogMessage = `${prefixSpacer}${msg}`;
      log(color(additionalLogMessage));
      // recordLogMessage(additionalLogMessage);
    };

    if (url) {
      logAdditional(`${chalk.bold('URL')}: ${url}`);
    }

    if (stackTrace && lineNumber) {
      logAdditional(`Stack trace line number: ${lineNumber}`);
      logAdditional(`Stack trace description: ${stackTrace.description}`);
      logAdditional(`Stack call frames: ${stackTrace.callFrames.join(', ')}`);
    }

    if (args) {
      logAdditional('Arguments:');
      logAdditional(`  ${JSON.stringify(args, null, 2).split('\n').join(`\n${prefixSpacer}  `).trimRight()}`);
    }
  };

  const browserLaunchHandler = (filter?: Filter, timeout = 60000): BrowserLaunchHandlerType => async (
    browser: Browser,
    browserLaunchOptions: BrowserLaunchOptions,
  ): Promise<BrowserLaunchOptions> => {
    if (!isLog) {
      return Promise.resolve(browserLaunchOptions);
    }

    const args = browserLaunchOptions.args || browserLaunchOptions;

    if (!isChrome(browser)) {
      debugLog(
        `Warning: An unsupported browser family was used, output will not be logged to console: ${browser.family}`,
      );

      return Promise.resolve(browserLaunchOptions);
    }

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
        client.Log.entryAdded(logEntry(filter));

        /** captures logs from console.X calls */
        client.Runtime.enable();
        client.Runtime.consoleAPICalled(logConsole(filter));

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
    const browserHandler = browserLaunchHandler(filterFunc(true));

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
    // for testing
    logConsole,
    logEntry,
  };
};
