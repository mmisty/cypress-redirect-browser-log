import { defineConfig } from 'cypress';
import { setupPlugins } from './integration/plugins';
import { redirectLogBrowser } from './src/plugins';

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

      const browserHandler = redirectLogBrowser(config);

      on('before:browser:launch', (browser, browserLaunchOptions) => {
        // your other browser handling
        return browserHandler(browser, browserLaunchOptions);
      });

      return config;
    },
  },
});
