import path from 'path';
import { redirectLog } from '../../src/plugins';
import Browser = Cypress.Browser;
import BrowserLaunchOptions = Cypress.BrowserLaunchOptions;
import { filterFunc } from '../../src/plugins/filter';
import { parseBoolean } from '../../src/utils/functions';
import { registerCoverage } from '../coverage-helper/plugin';

const log = (...args: unknown[]) => {
  console.log('[plugin] ', ...args);
};

export const setupNode = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Cypress.PluginConfigOptions => {
  const coverage = parseBoolean(process.env.COVERAGE || process.env.CYPRESS_COVERAGE);
  const cwd = process.cwd();
  const instrumented = path.join(cwd, 'instrumented');
  const tsConfigCoverage = path.join(__dirname, '../tsconfig.cov.json');
  const reportsPath = process.env.REPORTS_PATH || path.join(cwd, 'reports');
  const reports = path.join(`${reportsPath}/coverage-cypress`);
  const src = path.join(cwd, 'src');

  registerCoverage(!!coverage, {
    src,
    instrumented,
    reports,
    tsConfigCoverage,
  })(on, config);

  const redirect = redirectLog({ isLog: true });

  // todo setup
  const browserHandler = redirect.browserLaunchHandler(filterFunc(true));

  // Other option
  // redirect.beforeBrowserLaunch(on);

  on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
    return browserHandler(browser, browserLaunchOptions);
  });

  log('CYPRESS ENV:');
  log(config.env);

  // It's IMPORTANT to return the config object
  // with any changed environment variables
  return config;
};
