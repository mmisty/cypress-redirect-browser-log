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

      redirectLog(on, config);
      //redirectLog(on, config, ['error', 'exception']);

      /*redirectLog(on, config, handler => {
        handler.on('error', res => {
          console.error(res.message);
        });
        handler.on('exception', res => {
          console.error(res.message);
        });
      });
    
      redirectLog(on, config, ['test:log'], handler => {
        handler.on('error', res => {
          console.error(res.message);
        });
        handler.on('exception', res => {
          console.error(res.message);
        });
      });*/

      /*const browserHandler = redirectLogBrowser(config, ['test:log'], handler => {
        handler.on('error', res => {
          console.error(res.message);
        });
        handler.on('exception', res => {
          console.error(res.message);
        });
      });*/

      /*(on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
        // your other browser handling
        return browserHandler(browser, browserLaunchOptions);
      });*/

      /*const redirect = redirectLog(config, evEmit => {
        evEmit.on('warn', warn => {
          console.log(`Warning: ${warn.date} ${warn.message}`);
        });
    
        evEmit.on('exception', exc => {
          console.log(`Uncaught: ${exc.date} ${exc.message}`);
        });
      });
    
      const browserHandler = redirect.browserLaunchHandler();
    
      // Other option
      // redirect.beforeBrowserLaunch(on);
    
      on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
        return browserHandler(browser, browserLaunchOptions);
      });
    */

      return config;
    },
  },
});
