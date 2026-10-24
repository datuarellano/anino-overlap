import { describe, expect, it } from 'vitest';
import { randomId, sha256Hex } from '../src/lib/hash';

describe('hash', () => {
  it('computes SHA-256 hex', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('generates ids from the safe alphabet', () => {
    expect(randomId(10)).toMatch(/^[a-km-np-z2-9]{10}$/);
  });
});
