import { defineConfig } from 'cypress';
import { setupNode } from './cypress-e2e/plugins';

export default defineConfig({
  defaultCommandTimeout: 1000,
  e2e: {
    supportFile: 'cypress-e2e/support/index.ts',
    specPattern: 'cypress-e2e/tests/**/*.(test|cy).*',
    screenshotsFolder: 'cypress-e2/screenshots',
    downloadsFolder: 'cypress-e2/downloads',
    videosFolder: 'cypress-e2/videos',
    setupNodeEvents(on, config) {
      return setupNode(on, config);
    },

    video: false,
  },
});
