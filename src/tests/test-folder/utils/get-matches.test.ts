import { getMatches } from '../../../utils/functions';

// jest tests to test plugins

describe('utils', () => {
  its('getMatches')
    .each([
      { str: 'afffc abe def abc', regexp: / (ab.)/g, result: [['abe'], ['abc']] },
      {
        str: 'afffc abe deg abc defk',
        regexp: / (ab.)\s(de.)/g,
        result: [
          ['abe', 'deg'],
          ['abc', 'def'],
        ],
      },
      { str: 'some str', regexp: / (xxx)/g, result: [] },
      { str: '"Fail: Message"', regexp: /["']([^"']+)["']/g ?? [], result: [['Fail: Message']] },
      {
        str: 'hi',
        regexp: /["']([^"']+)["']/,
        err: 'Specify global flag (g) for regexp in getMatches func',
      },
    ])
    .run(t => {
      const fn = () => getMatches(t.str, t.regexp);

      if (t.err) {
        expect(fn).toThrow(t.err);
      } else {
        expect(fn()).toEqual(t.result);
      }
    });
});
