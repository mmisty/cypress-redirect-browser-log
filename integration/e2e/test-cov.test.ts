import { checkCov } from 'cy-local/utils';

describe('suite', () => {
  it('test', () => {
    expect(checkCov('cypress')).eq('cypress');
  });
});
