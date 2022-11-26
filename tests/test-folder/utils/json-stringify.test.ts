import { stringifyWithCatch } from '../../../src/utils/json-utils';

describe('utils', () => {
  const circular = {
    prop1: 'abc',
    get prop2() {
      return circular;
    },
  };

  its('stringifyWithCatch')
    .each([
      {
        desc: 'circular',
        obj: () => circular,
        expected: 'Could not stringify',
      },
      {
        desc: 'correct: string',
        obj: () => 'some str',
        expected: '"some str"',
      },
      {
        desc: 'correct: array',
        obj: () => ['a', 'b', 'c'],
        expected: '["a","b","c"]',
      },
      {
        desc: 'correct: array of obj',
        obj: () => [{ prop: '1' }, { prop: '2' }, { prop: '3' }],
        expected: '[{"prop":"1"},{"prop":"2"},{"prop":"3"}]',
      },
      {
        desc: 'correct:  obj',
        obj: () => ({ prop: '1', abc: 'abcds' }),
        expected: '{"prop":"1","abc":"abcds"}',
      },
      {
        desc: 'correct indent',
        obj: () => ({ prop: '1', abc: 'abcds' }),
        indent: true,
        expected: '{\n  "prop": "1",\n  "abc": "abcds"\n}',
      },
      {
        desc: 'correct indent',
        obj: () => circular,
        indent: true,
        errToLog: 'Error to log',
        expected: 'Error to log',
      },
    ])
    .run(t => {
      expect(stringifyWithCatch(t.obj(), t.indent, t.errToLog)).toEqual(t.expected);
    });
});
