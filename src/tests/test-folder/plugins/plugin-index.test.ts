import { redirectLog } from '../../../plugins';
import { filterFunc } from '../../../plugins/filter';
import { consoleMock } from '../../mocks/console-mock';

describe('redirectLog plugin', () => {
  it('should not crash', async () => {
    const mockLog = consoleMock.log;

    const res = redirectLog();
    const handler = res.browserLaunchHandler(filterFunc(true), 200);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'chrome' }, { args: [] });
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toContainEqual([
      '[browser-log-to-output] Attempting to connect to Chrome Debugging Protocol',
    ]);
    /* expect(mockLog.mock.calls).toContainEqual([
      '[browser-log-to-output] Could not connect to Debugging Protocol after 5 attempts',
    ]);*/
  });

  it('should not crash 2', async () => {
    const mockLog = consoleMock.log;

    const res = redirectLog();
    const handler = res.browserLaunchHandler(filterFunc(true), 50);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'electron', family: 'chromium' }, { args: [] });
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toContainEqual([
      '[browser-log-to-output] Warning: An unsupported browser family was used, output will not be logged to console: chromium',
    ]);
  });

  it('should not crash 3', async () => {
    const mockLog = consoleMock.log;

    const res = redirectLog();
    const handler = res.browserLaunchHandler(filterFunc(true), 50);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'chrome', family: 'chromium' }, { args: ['--remote-debugging-port=3000'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toContainEqual(['[browser-log-to-output] existing port: --remote-debugging-port=3000']);
    expect(mockLog.mock.calls).toContainEqual(['[browser-log-to-output] Error: connect ECONNREFUSED 127.0.0.1:3000']);
  });

  it('logEntry', async () => {
    process.env.DEBUG = 'browser-log-to-output';
    const mockLog = consoleMock.log;

    const res = redirectLog();
    const handler = res.browserLaunchHandler(filterFunc(true), 50);
    let error: Error | undefined = undefined;

    try {
      await handler({ name: 'chrome', family: 'chromium' }, { args: ['--remote-debugging-port=3000'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error).toBeUndefined();
    expect(mockLog.mock.calls).toEqual([]);
  });
});
