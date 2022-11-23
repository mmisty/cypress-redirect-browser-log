import { Runtime } from 'inspector';
import { filterFunc, LogEntry } from '../../../plugins/filter';
import { consoleMock } from '../../mocks/console-mock';
import { redirectLog } from '../../../plugins';

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

describe('redirect-logs', () => {
  describe('redirectLog inside', () => {
    it('logEntry', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logEntry()({ entry: browserApiEvent });

      expect(console.log?.mock.calls[0][0]).toContain('[2021-10-07T03:19:27.343Z] undefined');
      expect(console.log?.mock.calls[0][0]).toContain(browserApiEvent.text);
      expect(console.error?.mock.calls).toEqual([]);
      expect(console.warn?.mock.calls).toEqual([]);
      expect(console.debug?.mock.calls).toEqual([]);
    });

    it('logEntry filterFunc', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logEntry(filterFunc(true))({ entry: browserApiEvent });

      expect(console.log?.mock.calls[0][0]).toContain(
        `FROM CHROME >> 2021-10-07T03:19:27.343Z |     log |  ${browserApiEvent.text}`,
      );

      expect(console.error?.mock.calls).toEqual([]);
      expect(console.warn?.mock.calls).toEqual([]);
      expect(console.debug?.mock.calls).toEqual([]);
    });

    it('logEntry with stack', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logEntry()({
        entry: {
          level: 'log',
          text: 'Message from Browser',
          timestamp: 1633576767343,
          url: 'some url',
          stackTrace: { callFrames: [] },
          lineNumber: 4,
        },
      });

      expect(console.error?.mock.calls).toEqual([]);
      expect(console.warn?.mock.calls).toEqual([]);
      expect(console.debug?.mock.calls).toEqual([]);
      expect(console.log?.mock.calls).toEqual([
        ['[2021-10-07T03:19:27.343Z] undefined \u001b[1mlog\u001b[22m (undefined): Message from Browser'],
        ['                                     \u001b[1mURL\u001b[22m: some url'],
        ['                                     Stack trace line number: 4'],
        ['                                     Stack trace description: undefined'],
        ['                                     Stack call frames: '],
      ]);
    });

    it('logEntry with args', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logEntry()({
        entry: {
          level: 'log',
          text: 'Message from Browser',
          timestamp: 1633576767343,
          url: 'some url',
          stackTrace: { callFrames: [] },
          lineNumber: 4,
          args: ['mya1', 'mya2'],
        },
      });

      expect(console.error?.mock.calls).toEqual([]);
      expect(console.warn?.mock.calls).toEqual([]);
      expect(console.debug?.mock.calls).toEqual([]);
      expect(console.log?.mock.calls).toEqual([
        ['[2021-10-07T03:19:27.343Z] undefined \u001b[1mlog\u001b[22m (undefined): Message from Browser'],
        ['                                     \u001b[1mURL\u001b[22m: some url'],
        ['                                     Stack trace line number: 4'],
        ['                                     Stack trace description: undefined'],
        ['                                     Stack call frames: '],
        ['                                     Arguments:'],
        [
          '                                       [\n                                         "mya1",\n                                         "mya2"\n                                       ]',
        ],
      ]);
    });

    it('logConsole', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logConsole()(consoleApiEvent);

      expect(console.warn?.mock.calls[0]).toEqual(undefined);
      expect(console.error?.mock.calls[0]).toEqual(undefined);
      expect(console.debug?.mock.calls[0]).toEqual(undefined);

      expect(console.log?.mock.calls[0][0][0]).toContain('[2021-10-07T03:19:27.343Z]');
      expect(console.log?.mock.calls[0][0][0]).toContain('console.log');
      expect(console.log?.mock.calls[0][0][0]).toContain('called');
    });

    it('logConsole filter', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logConsole(filterFunc(true))(consoleApiEvent);

      expect(console.warn?.mock.calls[0]).toEqual(undefined);
      expect(console.error?.mock.calls[0]).toEqual(undefined);
      expect(console.debug?.mock.calls[0]).toEqual(undefined);

      expect(console.log?.mock.calls[0]).toEqual(['FROM CHROME >> 2021-10-07T03:19:27.343Z |     log |  My message']);
    });

    it('logConsole error', () => {
      const console = consoleMock;
      const res = redirectLog();
      res.logConsole()({
        type: 'error',
        args: [
          {
            type: 'string',
            value: 'My message',
          },
        ],
        timestamp: 1633576767343,
        executionContextId: 2,
      });

      expect(console.warn?.mock.calls[0]).toEqual(undefined);
      expect(console.error?.mock.calls[0]).toEqual(undefined);
      expect(console.debug?.mock.calls[0]).toEqual(undefined);

      expect(console.log?.mock.calls[0]).toEqual([
        '\u001b[31m[2021-10-07T03:19:27.343Z] ⚠ \u001b[1mconsole.error\u001b[22m called\u001b[39m',
      ]);
    });
  });

  it('Should be no logging when logging switched off', () => {
    const console = consoleMock;
    filterFunc(false)('console', consoleApiEvent);

    expect(console.log?.mock.calls[0]).toEqual(undefined);
    expect(console.error?.mock.calls[0]).toEqual(undefined);
    expect(console.warn?.mock.calls[0]).toEqual(undefined);
    expect(console.debug?.mock.calls[0]).toEqual(undefined);
  });

  its('unknown event')
    .each([
      {
        desc: 'simple event',
        event: { type: 'Some Ev' },
        expected: {
          warn: [['UNKNOWN LOG TYPE: other'], [{ type: 'Some Ev' }]],
        },
      },
    ])
    .run(t => {
      const console = consoleMock;
      filterFunc(true)('other', t.event);

      expect(console.log?.mock.calls).toEqual([]);
      expect(console.error?.mock.calls).toEqual([]);
      expect(console.warn?.mock.calls).toEqual(t.expected.warn ?? []);
      expect(console.debug?.mock.calls).toEqual([]);
    });

  its('console api')
    .each<{
      event: Runtime.ConsoleAPICalledEventDataType;
      expected: {
        log?: string[][];
        error?: string[][];
        warn?: string[][];
        debug?: string[][];
      };
    }>([
      {
        desc: 'simple event',
        event: consoleApiEvent,
        expected: {
          log: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |     log |  My message']],
        },
      },
      {
        desc: 'simple event - no value',
        event: { ...consoleApiEvent, args: [{ type: 'string' }] },
        expected: {
          log: [
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |     log |  <No message parsed> Log object: {"type":"string"}'],
          ],
        },
      },
      {
        desc: 'simple error event',
        event: { ...consoleApiEvent, type: 'error' },
        expected: {
          error: [
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |  My message'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |  STACK:'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |      undefined'],
          ],
        },
      },
      {
        desc: 'simple warn event',
        event: { ...consoleApiEvent, type: 'warning' },
        expected: {
          warn: [
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z | warning |  My message'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z | warning |  STACK:'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z | warning |      undefined'],
          ],
        },
      },
      {
        desc: 'simple debug event',
        event: { ...consoleApiEvent, type: 'debug' },
        expected: {
          debug: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |   debug |  My message']],
        },
      },
      {
        desc: 'simple uncaught error event',
        event: {
          ...consoleApiEvent,
          type: 'log',
          args: [{ type: 'log', value: '{"Error":{},"Event":"dsdsd"}' }],
        },
        expected: {
          error: [
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |  {"Error":{},"Event":"dsdsd"}'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |  STACK:'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |      undefined'],
          ],
        },
      },
      {
        desc: 'simple test event',
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
        expected: {
          log: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    test |  hello from test']],
        },
      },
      {
        desc: 'test event - no message',
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
        expected: {
          log: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    test |  command: get, details: "test"']],
        },
      },
      {
        desc: 'test event - full',
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
        expected: {
          log: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |    test |  command: get -> Hi from test, details: "test"']],
        },
      },
      {
        desc: 'test event - full with json details',
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
        expected: {
          log: [
            [
              'FROM CHROME >> 2021-10-07T03:19:27.343Z |    test |  command: get -> Hi from test, details: {"obj2":"value"}',
            ],
          ],
        },
      },
    ])
    .run(t => {
      const console = consoleMock;
      filterFunc(true)('console', t.event);

      expect(console.log?.mock.calls).toEqual(t.expected.log ?? []);
      expect(console.error?.mock.calls).toEqual(t.expected.error ?? []);
      expect(console.warn?.mock.calls).toEqual(t.expected.warn ?? []);
      expect(console.debug?.mock.calls).toEqual(t.expected.debug ?? []);
    });

  its('browser api')
    .each<{
      event: LogEntry;
      expected: {
        log?: string[][];
        error?: string[][];
        warn?: string[][];
        debug?: string[][];
      };
    }>([
      {
        desc: 'simple event',
        event: browserApiEvent,
        expected: {
          log: [['FROM CHROME >> 2021-10-07T03:19:27.343Z |     log |  Message from Browser']],
        },
      },
      {
        desc: 'error event with stack',
        event: {
          ...browserApiEvent,
          level: 'error',
          stackTrace: {
            callFrames: [
              {
                functionName: 'my func',
                scriptId: 'scriptId',
                url: '//bbbburl',
                lineNumber: 10,
                columnNumber: 10,
              },
            ],
          },
        },
        expected: {
          error: [
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |  Message from Browser'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |  STACK:'],
            ['FROM CHROME >> 2021-10-07T03:19:27.343Z |   error |      at //bbbburl:10 (my func)'],
          ],
        },
      },
    ])
    .run(t => {
      const console = consoleMock;
      filterFunc(true)('browser', { type: 'log', ...t.event });

      expect(console.log?.mock.calls).toEqual(t.expected.log ?? []);
      expect(console.error?.mock.calls).toEqual(t.expected.error ?? []);
      expect(console.warn?.mock.calls).toEqual(t.expected.warn ?? []);
      expect(console.debug?.mock.calls).toEqual(t.expected.debug ?? []);
    });

  describe('incorrect events', () => {
    const circular = {
      prop1: 'abc',
      get prop2() {
        return circular;
      },
    };

    it('browser incorrect', () => {
      const console = consoleMock;
      filterFunc(true)('browser', { type: 'log' });

      expect(console.log?.mock.calls).toEqual([]);
      expect(console.error?.mock.calls).toEqual([]);

      expect(console.warn?.mock.calls).toEqual([['NOT A browserLog EVENT: -------\n{"type":"log"}']]);
      expect(console.debug?.mock.calls).toEqual([]);
    });

    it('browser incorrect circular', () => {
      const console = consoleMock;
      filterFunc(true)('browser', { type: 'log', ...circular });

      expect(console.log?.mock.calls).toEqual([]);
      expect(console.error?.mock.calls).toEqual([]);

      expect(console.warn?.mock.calls).toEqual([['NOT A browserLog EVENT: -------\nCould not stringify']]);
      expect(console.debug?.mock.calls).toEqual([]);
    });

    it('console incorrect', () => {
      const console = consoleMock;
      filterFunc(true)('console', { type: 'log' });

      expect(console.log?.mock.calls).toEqual([]);
      expect(console.error?.mock.calls).toEqual([]);

      expect(console.warn?.mock.calls).toEqual([['NOT A CONSOLE API EVENT: -------\n{"type":"log"}']]);
      expect(console.debug?.mock.calls).toEqual([]);
    });

    it('console incorrect circular', () => {
      const console = consoleMock;
      filterFunc(true)('console', { type: 'log', ...circular });

      expect(console.log?.mock.calls).toEqual([]);
      expect(console.error?.mock.calls).toEqual([]);

      expect(console.warn?.mock.calls).toEqual([['NOT A CONSOLE API EVENT: -------\nCould not stringify']]);
      expect(console.debug?.mock.calls).toEqual([]);
    });
  });
});
