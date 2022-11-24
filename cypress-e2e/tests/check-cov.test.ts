import { checkCovFn } from 'cy-local/utils/functions';

describe('check cov merge', () => {
  it('cypress', () => {
    expect(checkCovFn('cy')).eq('cypress');
  });
});
