
import { sha256 } from '../utils/hash.js';

describe('sha256', () => {
  it('creates deterministic hash output', () => {
    expect(sha256('blockcertify')).toEqual(sha256('blockcertify'));
  });
});
