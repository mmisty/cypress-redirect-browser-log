import PluginEvents = Cypress.PluginEvents;
import PluginConfigOptions = Cypress.PluginConfigOptions;
import { preprocessor } from './ts-preprocessor';
import { existsSync, rmdirSync } from 'fs';
import { resolve } from 'path';
import { COVERAGE } from '../common/constants';
import { redirectLog } from '../../src/plugins';
import Browser = Cypress.Browser;
import BrowserLaunchOptions = Cypress.BrowserLaunchOptions;

/**
 * Clear compiled js files from previous runs, otherwise coverage will be messed up
 */
const clearJsFiles = () => {
  // remove previous in
  const jsFiles = resolve('js-files-cypress');

  if (existsSync(jsFiles)) {
    rmdirSync(jsFiles, { recursive: true });
  }
};

const isCoverage = (config: PluginConfigOptions) => {
  return process.env[COVERAGE] || config.env[COVERAGE];
};

export const setupPlugins = (on: PluginEvents, config: PluginConfigOptions) => {
  clearJsFiles();
  const isCov = isCoverage(config);

  if (isCov) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@cypress/code-coverage/task')(on, config);
    config.env[COVERAGE] = true;
  }

  on('file:preprocessor', preprocessor(isCov));

  const redirect = redirectLog(
    config,
    { defaultListeners: ['exception', 'error', 'warn', 'log', 'debug', 'test:log'] },
    evEmit => {
      evEmit.on('warn', warn => {
        console.log(`${warn.date} ${warn.logType} ${warn.message}`);
      });

      evEmit.on('exception', exc => {
        console.log(`${exc.date} ${exc.logType} ${exc.message}`);
      });
    },
  );

  const browserHandler = redirect.browserLaunchHandler();

  // Other option
  // redirect.beforeBrowserLaunch(on);

  on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
    return browserHandler(browser, browserLaunchOptions);
  });

  console.log('CYPRESS ENV:');
  console.log(config.env);

  // It's IMPORTANT to return the config object
  // with any changed environment variables
  return config;
};
