import { describe, expect, it } from 'vitest';
import { bestTimes } from '../src/lib/bestTimes';

const slots = [0, 30, 60, 90, 120, 150];

describe('bestTimes', () => {
  it('ranks by headcount, then length', () => {
    const people = [
      { key: 'a', name: 'Ana', slots: [0, 30, 60, 90] },
      { key: 'b', name: 'Ben', slots: [30, 60, 120, 150] },
      { key: 'c', name: 'Cy', slots: [30, 60] },
    ];
    const [top, second] = bestTimes(slots, 30, people);
    expect(top).toMatchObject({ start: 30, end: 90, available: ['Ana', 'Ben', 'Cy'], missing: [] });
    expect(second).toMatchObject({ start: 120, end: 180, available: ['Ben'] });
  });

  it('does not merge across gaps between slots', () => {
    const people = [{ key: 'a', name: 'Ana', slots: [0, 120] }];
    const blocks = bestTimes([0, 120], 30, people);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ start: 0, end: 30 });
  });

  it('skips slots where nobody is free', () => {
    expect(bestTimes(slots, 30, [{ key: 'a', name: 'Ana', slots: [] }])).toEqual([]);
  });
});
