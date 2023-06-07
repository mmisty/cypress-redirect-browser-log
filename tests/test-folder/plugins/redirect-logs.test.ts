import type { Runtime } from 'inspector';
import { consoleMock } from '../../mocks/console-mock';
import { transform } from '../../../src/plugins';
import { ConsoleEvents, TypedEventEmitter } from '../../../src/plugins/event-emitter';
import type { LogEntry } from '../../../src/plugins/converters/browser-log';
import { defaultHandlers } from '../../../src/plugins/default-handlers';

describe('redirect-logs', () => {
  const circular = {
    prop1: 'abc',
    get prop2() {
      return circular;
    },
  };

  const consoleApiEvent: Runtime.ConsoleAPICalledEventDataType = {
    type: 'log',
    args: [
      {
        type: 'string',
        value: 'My message',
      },
    ],
    timestamp: 1633576767343,
    executionContextId: 2,
  };

  const browserApiEvent: LogEntry = {
    level: 'log',
    text: 'Message from Browser',
    timestamp: 1633576767343,
    url: 'some url',
    stackTrace: { callFrames: [] },
  };

  const exception = {
    timestamp: 1677149215467.1072,
    exceptionDetails: {
      exceptionId: 1,
      text: 'Uncaught',
      lineNumber: 3,
      columnNumber: 18,
      scriptId: '27',
      url: 'http://localhost:58708/mytest.com',
      stackTrace: {
        callFrames: [
          {
            functionName: '',
            scriptId: '27',
            url: 'http://localhost:58708/mytest.com',
            lineNumber: 3,
            columnNumber: 18,
          },
        ],
      },
      exception: {
        type: 'object',
        subtype: 'error',
        className: 'Error',
        description: 'Error: Special exception from code\n    at http://localhost:58708/mytest.com:4:19',
        objectId: '9201113493710184414.7.1',
        preview: {
          type: 'object',
          subtype: 'error',
          description: 'Error: Special exception from code\n    at http://localhost:58708/mytest.com:4:19',
          overflow: false,
          properties: [
            { name: 'docsUrl', type: 'undefined', value: 'undefined' },
            {
              name: 'stack',
              type: 'string',
              value: 'Error: Special exception from code\n    at http://localhost:58708/mytest.com:4:19',
            },
            { name: 'message', type: 'string', value: 'Special exception from code' },
          ],
        },
      },
      executionContextId: 7,
    },
  };

  let consoleMocked;
  let ev: TypedEventEmitter<ConsoleEvents>;
  beforeEach(() => {
    consoleMocked = consoleMock();
    ev = new TypedEventEmitter<ConsoleEvents>();
  });

  describe('default log', () => {
    its('browser event')
      .each([
        {
          desc: 'browserApiEvent with log message, logging only log - console should have message',
          event: { entry: browserApiEvent },
          levels: ['log'] as (keyof ConsoleEvents)[],
          logExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |      log | Message from Browser']],
          warnExp: [],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with trace message, logging only log - console should NOT have message',
          event: { entry: browserApiEvent },
          levels: ['trace'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with table message, logging only log - console should NOT have message',
          event: { entry: browserApiEvent },
          levels: ['table'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with debug message, logging only log - console should NOT have message',
          event: { entry: browserApiEvent },
          levels: ['debug'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with log message, logging only errors - console should be empty',
          event: { entry: browserApiEvent },
          levels: ['error'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with log message, logging only warns - console should be empty',
          event: { entry: browserApiEvent },
          levels: ['warn'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with error message, logging only errors - console should have message error',
          event: {
            entry: {
              ...browserApiEvent,
              level: 'error',
              stackTrace: {
                callFrames: [
                  {
                    functionName: '',
                    scriptId: '27',
                    url: 'http://localhost:58708/mytest.com',
                    lineNumber: 3,
                    columnNumber: 18,
                  },
                ],
              },
            },
          },
          levels: ['error'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [
            [
              'FROM CHROME >> 2021-10-07T03:19:27.343Z |    error | Message from Browser\n' +
                'FROM CHROME >> 2021-10-07T03:19:27.343Z |    error |     at http://localhost:58708/mytest.com:3:18 (<no functionName>)',
            ],
          ],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with warn message, logging only warns - console should have message warn',
          event: {
            entry: {
              ...browserApiEvent,
              level: 'warning',
              stackTrace: {
                callFrames: [
                  {
                    functionName: 'myFunc',
                    scriptId: '27',
                    url: 'http://localhost:58708/mytest.com',
                    lineNumber: 3,
                    columnNumber: 18,
                  },
                ],
              },
            },
          },
          levels: ['warn'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [
            [
              'FROM CHROME >> 2021-10-07T03:19:27.343Z |  warning | Message from Browser\n' +
                'FROM CHROME >> 2021-10-07T03:19:27.343Z |  warning |     at http://localhost:58708/mytest.com:3:18 (myFunc)',
            ],
          ],
          errExp: [],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with error message, logging only errors - console should have message error (no stack)',
          event: { entry: { ...browserApiEvent, level: 'error' } },
          levels: ['error'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    error | Message from Browser']],
          debugExp: [],
        },
        {
          desc: 'browserApiEvent with error message - no stack as object',
          event: { entry: { ...browserApiEvent, level: 'error', stackTrace: undefined } },
          levels: ['error'] as (keyof ConsoleEvents)[],
          logExp: [],
          warnExp: [],
          errExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    error | Message from Browser']],
          debugExp: [],
        },
      ])
      .run(t => {
        t.levels.forEach(lev => defaultHandlers(lev, ev));
        transform(ev)(t.event);

        expect(consoleMocked.log?.mock.calls).toEqual(t.logExp);
        expect(consoleMocked.debug?.mock.calls).toEqual(t.debugExp);
        expect(consoleMocked.warn?.mock.calls).toEqual(t.warnExp);
        expect(consoleMocked.error?.mock.calls).toEqual(t.errExp);
      });

    describe('console event', () => {
      its('console event')
        .each([
          {
            desc: 'consoleApiEvent with log message, logging only log - console should have message',
            event: consoleApiEvent,
            levels: ['log'] as (keyof ConsoleEvents)[],
            logExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |      log | My message']],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'consoleApiEvent with log message, no value',
            event: { ...consoleApiEvent, args: [{ type: 'string' }] },
            levels: ['log'] as (keyof ConsoleEvents)[],
            logExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |      log | <No message parsed> {"type":"string"}']],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'consoleApiEvent with warning message',
            event: { ...consoleApiEvent, type: 'warning' },
            levels: ['warn'] as (keyof ConsoleEvents)[],
            logExp: [],
            warnExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |  warning | My message']],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'consoleApiEvent with debug message',
            event: { ...consoleApiEvent, type: 'debug' },
            levels: ['debug'] as (keyof ConsoleEvents)[],
            logExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    debug | My message']],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'consoleApiEvent with warning message and stack',
            event: {
              ...consoleApiEvent,
              type: 'warning',
              stackTrace: { callFrames: [{ url: 'sds', lineNumber: 1, columnNumber: 2 }] },
            },
            levels: ['warn'] as (keyof ConsoleEvents)[],
            logExp: [],
            warnExp: [
              [
                'FROM CHROME >> 2021-10-07T03:19:27.343Z |  warning | My message\n' +
                  'FROM CHROME >> 2021-10-07T03:19:27.343Z |  warning |     at sds:1:2 (<no functionName>)',
              ],
            ],
            errExp: [],
            debugExp: [],
          },

          {
            desc: 'consoleApiEvent with error message, logging only error - console should have message',
            event: {
              type: 'error',
              args: [
                {
                  type: 'string',
                  value: 'My message',
                },
              ],
              timestamp: 1633576767343,
              executionContextId: 2,
            },
            levels: ['log', 'error'] as (keyof ConsoleEvents)[],
            logExp: [],
            warnExp: [],
            errExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    error | My message']],
            debugExp: [],
          },
          {
            desc: 'consoleApiEvent with exception - no logs',
            event: exception,
            levels: ['log'] as (keyof ConsoleEvents)[],
            logExp: [],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'consoleApiEvent with exception - should show uncaught',
            event: exception,
            levels: ['exception'] as (keyof ConsoleEvents)[],
            logExp: [],
            warnExp: [],
            errExp: [
              [
                'FROM CHROME >> 2023-02-23T10:46:55.467Z | UNCAUGHT | Error: Special exception from code\n' +
                  'FROM CHROME >> 2023-02-23T10:46:55.467Z | UNCAUGHT |   at http://localhost:58708/mytest.com:4:19',
              ],
            ],
            debugExp: [],
          },
          {
            desc: 'unknown event',
            event: { type: 'Some Ev' },
            levels: ['exception', 'log', 'debug', 'error', 'warn', 'test:log'] as (keyof ConsoleEvents)[],
            logExp: [
              ['[cypress-redirect-browser-log] Unknown EVENT: -------\n'],
              ['[cypress-redirect-browser-log] {"type":"Some Ev"}'],
            ],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'simple test event',
            levels: ['test:log'] as (keyof ConsoleEvents)[],
            event: {
              ...consoleApiEvent,
              type: 'log',
              args: [
                {
                  type: 'string',
                  value: '{"log":"test", "logType":"test", "message":"hello from test"}',
                },
              ],
            },
            logExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |     test | hello from test']],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'test event - no message',
            levels: ['test:log'] as (keyof ConsoleEvents)[],
            event: {
              ...consoleApiEvent,
              type: 'log',
              args: [
                {
                  type: 'string',
                  value: '{"log":"test", "logType":"test","details":"test","command":"get"}',
                },
              ],
            },
            logExp: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |     test | command: get ->  | details: test']],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'test event - full',
            levels: ['test:log'] as (keyof ConsoleEvents)[],
            event: {
              ...consoleApiEvent,
              type: 'log',
              args: [
                {
                  type: 'string',
                  value: '{"log":"test", "logType":"test","message":"Hi from test","details":"test","command":"get"}',
                },
              ],
            },

            logExp: [
              ['FROM CHROME >> 2021-10-07T03:19:27.343Z |     test | command: get -> Hi from test | details: test'],
            ],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
          {
            desc: 'test event - full with json details',
            levels: ['test:log'] as (keyof ConsoleEvents)[],
            event: {
              ...consoleApiEvent,
              type: 'log',
              args: [
                {
                  type: 'string',
                  value:
                    '{"log":"test", "logType":"test","message":"Hi from test","details":"{\\"obj2\\":\\"value\\"}","command":"get"}',
                },
              ],
            },
            logExp: [
              [
                'FROM CHROME >> 2021-10-07T03:19:27.343Z |     test | command: get -> Hi from test | details: {"obj2":"value"}',
              ],
            ],
            warnExp: [],
            errExp: [],
            debugExp: [],
          },
        ])
        .run(t => {
          t.levels.forEach(lev => defaultHandlers(lev, ev));
          transform(ev)(t.event as any);

          expect(consoleMocked.log?.mock.calls).toEqual(t.logExp);
          expect(consoleMocked.debug?.mock.calls).toEqual(t.debugExp);
          expect(consoleMocked.warn?.mock.calls).toEqual(t.warnExp);
          expect(consoleMocked.error?.mock.calls).toEqual(t.errExp);
        });
    });

    it('user defined handler: log', () => {
      // non default
      ev.on('log', args => {
        console.log(args);
      });

      transform(ev)({ entry: browserApiEvent });
      expect(consoleMocked.log?.mock.calls[0][0]).toEqual({
        date: '2021-10-07T03:19:27.343Z',
        logType: 'log',
        message: 'Message from Browser',
        source: 'browser',
        stack: undefined,
        timestamp: 1633576767343,
      });
      expect(consoleMocked.error?.mock.calls).toEqual([]);
      expect(consoleMocked.warn?.mock.calls).toEqual([]);
      expect(consoleMocked.debug?.mock.calls).toEqual([]);
    });

    it('user defined handler: error - no log', () => {
      // non default
      ev.on('error', args => {
        console.log(args);
      });

      transform(ev)({ entry: browserApiEvent });
      expect(consoleMocked.log?.mock.calls).toEqual([]);
      expect(consoleMocked.error?.mock.calls).toEqual([]);
      expect(consoleMocked.warn?.mock.calls).toEqual([]);
      expect(consoleMocked.debug?.mock.calls).toEqual([]);
    });

    it('user defined handler: error - has log', () => {
      // non default
      ev.on('error', args => {
        console.log(args);
      });

      transform(ev)({ entry: { ...browserApiEvent, level: 'error' } });
      expect(consoleMocked.log?.mock.calls).toEqual([
        [
          {
            date: '2021-10-07T03:19:27.343Z',
            logType: 'error',
            message: 'Message from Browser',
            source: 'browser',
            stack: '',
            timestamp: 1633576767343,
          },
        ],
      ]);
      expect(consoleMocked.error?.mock.calls).toEqual([]);
      expect(consoleMocked.warn?.mock.calls).toEqual([]);
      expect(consoleMocked.debug?.mock.calls).toEqual([]);
    });

    it('user defined handler: test:log - has log', () => {
      // non default
      ev.on('test:log', args => {
        console.log(args);
      });

      transform(ev)({
        ...consoleApiEvent,
        type: 'log',
        args: [
          {
            type: 'string',
            value: '{"log":"test", "logType":"test","message":"Hi from test","details":"test","command":"get"}',
          },
        ],
      });
      expect(consoleMocked.log?.mock.calls).toEqual([
        [
          {
            command: 'get',
            date: '2021-10-07T03:19:27.343Z',
            details: 'test',
            logType: 'test',
            message: 'Hi from test',
            source: 'console:test',
            timestamp: 1633576767343,
          },
        ],
      ]);
      expect(consoleMocked.error?.mock.calls).toEqual([]);
      expect(consoleMocked.warn?.mock.calls).toEqual([]);
      expect(consoleMocked.debug?.mock.calls).toEqual([]);
    });
  });

  it('console incorrect circular', () => {
    const data = {
      desc: 'consoleApiEvent circular',
      event: { type: 'log', ...circular },
      levels: ['log'] as (keyof ConsoleEvents)[],
      logExp: [
        ['[cypress-redirect-browser-log] Unknown EVENT: -------\n'],
        ['[cypress-redirect-browser-log] Could not stringify'],
      ],
      warnExp: [],
      errExp: [],
      debugExp: [],
    };
    data.levels.forEach(lev => defaultHandlers(lev, ev));
    transform(ev)(data.event as any);

    expect(consoleMocked.log?.mock.calls).toEqual(data.logExp);
    expect(consoleMocked.debug?.mock.calls).toEqual(data.debugExp);
    expect(consoleMocked.warn?.mock.calls).toEqual(data.warnExp);
    expect(consoleMocked.error?.mock.calls).toEqual(data.errExp);
  });

  it('browser incorrect circular', () => {
    const data = {
      desc: 'browser incorrectApiEvent circular',
      event: { entry: { type: 'log', ...circular } },
      levels: ['log'] as (keyof ConsoleEvents)[],
      logExp: [],
      warnExp: [],
      errExp: [],
      debugExp: [],
    };
    data.levels.forEach(lev => defaultHandlers(lev, ev));
    transform(ev)(data.event as any);

    expect(consoleMocked.log?.mock.calls).toEqual(data.logExp);
    expect(consoleMocked.debug?.mock.calls).toEqual(data.debugExp);
    expect(consoleMocked.warn?.mock.calls).toEqual(data.warnExp);
    expect(consoleMocked.error?.mock.calls).toEqual(data.errExp);
  });
});
