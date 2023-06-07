import { defineConfig } from 'cypress';
import { setupPlugins } from './integration/plugins';
import { redirectLog } from './src/plugins';

const cypressFolder = 'integration';

export default defineConfig({
  e2e: {
    specPattern: `${cypressFolder}/e2e/**/*.(cy|test|spec).ts`,
    supportFile: `${cypressFolder}/support/index.ts`,
    downloadsFolder: `${cypressFolder}/downloads`,
    videosFolder: `${cypressFolder}/videos`,
    fixturesFolder: `${cypressFolder}/fixtures`,
    screenshotsFolder: `${cypressFolder}/screenshots`,
    video: false,

    setupNodeEvents(on, config) {
      setupPlugins(on, config);

      // disable test log
      redirectLog(on, config, ev => {
        ev.on('test:log', () => {
          // ignore
        });
      });

      return config;
    },
  },
});
