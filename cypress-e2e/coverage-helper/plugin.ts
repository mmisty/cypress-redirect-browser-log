// returns plugins path
import { instrumentSync } from './instrument';
import path from 'path';
import { configureWebpack, webpackPreprocessor } from './webpack-processing';

const chalk = require('chalk');

const log = (...args: unknown[]) => {
  console.log('[plugin] ', ...args);
};

const instrumentApp = (src: string, instrumented: string, reports: string) => {
  log('Coverage setup: ');
  log(`\t Reports path: ${chalk.bold(reports)}`);
  instrumentSync(path.resolve(src), instrumented, reports);
};

export const registerCoverage = (
  coverage: boolean,
  opts: {
    src: string;
    reports: string;
    instrumented: string;
    tsConfigCoverage: string;
  },
) => (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  const { reports, src, instrumented, tsConfigCoverage } = opts;
  // eslint-disable-next-line no-console
  log(`CODE COVERAGE CYPRESS: ${coverage}`);

  let coverageTsConfig = undefined;

  if (coverage) {
    coverageTsConfig = tsConfigCoverage;
    // instrumentApp(src, instrumented, reports);

    const fs = require('fs');

    if (!fs.existsSync(coverageTsConfig)) {
      throw new Error(`Tsconfig for coverage not exist: file ${coverageTsConfig}`);
    }

    log(`Using tsconfig: ${coverageTsConfig}`);
    config.env.COVERAGE = coverage;

    require('@cypress/code-coverage/task')(on, config);
  }

  configureWebpack({
    tsRawConfigPath: coverageTsConfig,
  });

  on('file:preprocessor', webpackPreprocessor());
};
