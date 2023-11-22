import { consoleMock } from '../../mocks/console-mock';
import Browser = Cypress.Browser;
import BrowserLaunchOptions = Cypress.BeforeBrowserLaunchOptions;
import { PACK_NAME } from '../../../src/plugins/pack';
import { redirectLogBrowser } from '../../../src/plugins';

describe('redirectLog plugin', () => {
  const cyOpts = (isOn: boolean, timeout: number) =>
    ({
      env: {
        REDIRECT_BROWSER_LOG: isOn ? 'true' : 'false',
        BROWSER_CONNECT_TIMEOUT: timeout ? `${timeout}` : undefined,
      },
    } as unknown as Cypress.PluginConfigOptions);

  it('should not log', async () => {
    process.env.DEBUG = PACK_NAME;
    const mockLog = consoleMock().log;
    const handler = redirectLogBrowser(cyOpts(false, 200), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'chrome' } as Browser, { args: [] } as any as BrowserLaunchOptions);
    } catch (err) {
      error = err as Error;
    }
    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toEqual([
      [
        '[cypress-redirect-browser-log] Logging from browser is off, to turn on set REDIRECT_BROWSER_LOG environment variable to true',
      ],
    ]);
  });

  it('should not crash with debug', async () => {
    process.env.DEBUG = PACK_NAME;
    const mockLog = consoleMock().log;
    const handler = redirectLogBrowser(cyOpts(true, 200), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'chrome' } as Browser, { args: [] } as any as BrowserLaunchOptions);
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    // filter port messages as random
    expect(
      mockLog.mock.calls.filter(
        t =>
          !t.some(m => (m as any).indexOf('new port') !== -1) &&
          !t.some(m => (m as any).indexOf('connect ECONNREFUSED') !== -1),
      ),
    ).toEqual([
      [
        '[cypress-redirect-browser-log] Logging from browser is on, to turn off set REDIRECT_BROWSER_LOG environment variable to false',
      ],
      ['[cypress-redirect-browser-log] Registering default console event handlers: log'],
      ['[cypress-redirect-browser-log] Attempting to connect to Chrome Debugging Protocol'],
      ['[cypress-redirect-browser-log] Could not connect to Debugging Protocol after 2 attempts'],
    ]);
  });

  it('should not crash with no debug', async () => {
    process.env.DEBUG = '';
    const mockLog = consoleMock().log;
    const handler = redirectLogBrowser(cyOpts(true, 200), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'chrome' } as Browser, { args: [] } as any as BrowserLaunchOptions);
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    // filter port messages as random
    expect(
      mockLog.mock.calls.filter(
        t =>
          !t.some(m => (m as any).indexOf('new port') !== -1) &&
          !t.some(m => (m as any).indexOf('connect ECONNREFUSED') !== -1),
      ),
    ).toEqual([
      [
        '[cypress-redirect-browser-log] Logging from browser is on, to turn off set REDIRECT_BROWSER_LOG environment variable to false',
      ],
    ]);
  });

  it('should not crash  - unsupported browser family - debug', async () => {
    process.env.DEBUG = PACK_NAME;
    const mockLog = consoleMock().log;

    const handler = redirectLogBrowser(cyOpts(true, 50), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'electron', family: 'chromium' } as Browser, { args: [] } as any as BrowserLaunchOptions);
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(
      mockLog.mock.calls.filter(
        t =>
          !t.some(m => (m as any).indexOf('new port') !== -1) &&
          !t.some(m => (m as any).indexOf('connect ECONNREFUSED') !== -1),
      ),
    ).toEqual([
      [
        '[cypress-redirect-browser-log] Logging from browser is on, to turn off set REDIRECT_BROWSER_LOG environment variable to false',
      ],
      ['[cypress-redirect-browser-log] Registering default console event handlers: log'],
      [
        '[cypress-redirect-browser-log] Warning: An unsupported browser family was used, output will not be logged to console: chromium',
      ],
    ]);
  });

  it('should not crash  - unsupported browser family - no debug', async () => {
    process.env.DEBUG = '';
    const mockLog = consoleMock().log;

    const handler = redirectLogBrowser(cyOpts(true, 50), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'electron', family: 'chromium' } as Browser, { args: [] } as any as BrowserLaunchOptions);
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(
      mockLog.mock.calls.filter(
        t =>
          !t.some(m => (m as any).indexOf('new port') !== -1) &&
          !t.some(m => (m as any).indexOf('connect ECONNREFUSED') !== -1),
      ),
    ).toEqual([
      [
        '[cypress-redirect-browser-log] Logging from browser is on, to turn off set REDIRECT_BROWSER_LOG environment variable to false',
      ],
      [
        '[cypress-redirect-browser-log] Warning: An unsupported browser family was used, output will not be logged to console: chromium',
      ],
    ]);
  });

  it('should not crash  - set port', async () => {
    process.env.DEBUG = PACK_NAME;
    const mockLog = consoleMock().log;

    const handler = redirectLogBrowser(cyOpts(true, 50), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler(
        { name: 'chrome', family: 'chromium' } as Browser,
        { args: ['--remote-debugging-port=3000'] } as any as BrowserLaunchOptions,
      );
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toContainEqual([
      '[cypress-redirect-browser-log] existing port: --remote-debugging-port=3000',
    ]);
  });

  it('debug logs', async () => {
    process.env.DEBUG = PACK_NAME;
    const mockLog = consoleMock().log;

    const handler = redirectLogBrowser(cyOpts(true, 50), ['log']);
    let error: Error | undefined = undefined;

    try {
      await handler(
        { name: 'chrome', family: 'chromium' } as Browser,
        { args: ['--remote-debugging-port=3000'] } as any as BrowserLaunchOptions,
      );
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toEqual([
      [
        '[cypress-redirect-browser-log] Logging from browser is on, to turn off set REDIRECT_BROWSER_LOG environment variable to false',
      ],
      ['[cypress-redirect-browser-log] Registering default console event handlers: log'],
      ['[cypress-redirect-browser-log] existing port: --remote-debugging-port=3000'],
      ['[cypress-redirect-browser-log] Attempting to connect to Chrome Debugging Protocol'],
      ['[cypress-redirect-browser-log] Could not connect to Debugging Protocol after 0.5 attempts'],
      ['[cypress-redirect-browser-log] Error: connect ECONNREFUSED 127.0.0.1:3000'],
    ]);
  });
});
