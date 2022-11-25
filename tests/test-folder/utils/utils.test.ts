import type { Runtime } from 'inspector';
import { appendMultiline, stringifyStack } from '../../../src/utils/string-utils';
import { noop } from '../../../src/utils/noop';
import { delay, parseBoolean } from '../../../src/utils/functions';

describe('utils', () => {
  its('appendMultiline')
    .each([
      {
        desc: 'one line',
        str: 'abcde fg',
        addition: 'BBB >> ',
        expected: 'BBB >>  abcde fg',
      },
      {
        desc: 'multiline',
        str: 'abcde fg\nefg \n hij',
        addition: 'BBB >> ',
        expected: 'BBB >> abcde fg\nBBB >> efg \nBBB >>  hij',
      },
    ])
    .run(t => {
      expect(appendMultiline(t.addition, t.str)).toEqual(t.expected);
    });

  its('stringifyStack')
    .each([
      {
        desc: 'simple',
        callFrames: (): Runtime.CallFrame[] => [
          {
            functionName: 'myFunc',
            url: 'http://bbb',
            scriptId: '333',
            lineNumber: 10,
            columnNumber: 10,
          },
        ],
        expected: 'at http://bbb:10 (myFunc)',
      },
      {
        desc: 'one line',
        callFrames: () => undefined,
        expected: undefined,
      },
    ])
    .run(t => {
      expect(stringifyStack(t.callFrames())).toEqual(t.expected);
    });

  it('noop', () => {
    expect(noop).not.toThrow();
  });

  its('parseBoolean')
    .each([
      { input: 'false', exp: false },
      { input: 'False', exp: false },
      { input: 'true', exp: true },
      { input: 'True', exp: true },
      { input: true, exp: true },
      { input: false, exp: false },
      { input: undefined, exp: undefined },
      { input: 1, err: 'Error during parsing boolean: unexpected type of value: number' },
      { input: { a: 4 }, err: 'Error during parsing boolean: unexpected type of value: object' },
      { input: [4], err: 'Error during parsing boolean: unexpected type of value: object' },
      { input: '1', err: 'String should have boolean value' },
      { input: '0', err: 'String should have boolean value' },
      { input: '0sss"', err: "Could not parse boolean from string: '0sss\"'" },
    ])
    .run(t => {
      const fn = () => parseBoolean(t.input as string | boolean);

      if (t.err) {
        expect(fn).toThrow(t.err);
      } else {
        expect(fn()).toBe(t.exp);
      }
    });

  its('delay').run(async () => {
    const started = Date.now();
    await delay(30);
    const end = Date.now();
    const diff = end - started;

    expect(diff).toBeGreaterThanOrEqual(10);
  });
});
