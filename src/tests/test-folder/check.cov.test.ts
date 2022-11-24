import { checkCovFn } from '../../utils/functions';

describe('check cov test', () => {
  it('test', () => {
    expect(checkCovFn('jest')).toEqual('jest');
  });
});
