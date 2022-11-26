import { tryParseJson } from '../../../src/utils/json-utils';

describe('utils', () => {
  its('tryParseJson')
    .each([
      {
        desc: 'string',
        obj: () => 'Some str',
        expected: null,
      },
      {
        desc: 'correct: string',
        obj: () => '"some str"',
        expected: 'some str',
      },
      {
        desc: 'correct: array',
        obj: () => '["a","b","c"]',
        expected: ['a', 'b', 'c'],
      },
      {
        desc: 'correct: array of obj',
        obj: () => '[{"prop":"1"},{"prop":"2"},{"prop":"3"}]',
        expected: [{ prop: '1' }, { prop: '2' }, { prop: '3' }],
      },
      {
        desc: 'correct:  obj',
        obj: () => '{"prop":"1","abc":"abcds"}',
        expected: { abc: 'abcds', prop: '1' },
      },
      {
        desc: 'with fail (string)',
        obj: () => 'sbsbsds',
        onFail: () => 'P P A P',
        expected: 'P P A P',
      },
      {
        desc: 'with fail (obj)',
        obj: () => 'sbsbsds',
        onFail: () => ({ hi: 'hola' }),
        expected: { hi: 'hola' },
      },
      {
        desc: 'with success unreachable (obj)',
        obj: () => 'sbsbsds',
        onFail: () => ({ hi: 'hola' }),
        onSucc: () => ({ hi: 'unreached' }),
        expected: { hi: 'hola' },
      },
      {
        desc: 'with success (obj)',
        obj: () => '"parsing string"',
        onSucc: (s: unknown) => ({ hi: s }),
        expected: { hi: 'parsing string' },
      },
    ])
    .run(t => {
      expect(tryParseJson<unknown, unknown>(t.obj(), t.onSucc, t.onFail)).toEqual(t.expected);
    });
});
