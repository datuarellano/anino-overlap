import { describe, expect, it } from 'vitest';
import { buildGrid, eventSlots } from '../src/lib/slots';
import type { EventDoc } from '../src/lib/types';

const ev: EventDoc = {
  id: 'x',
  title: 't',
  timezone: 'Asia/Manila',
  dates: ['2026-10-20', '2026-10-21'],
  startMin: 9 * 60,
  endMin: 11 * 60,
  slotMin: 30,
  creatorUid: 'u',
};

describe('eventSlots', () => {
  it('creates one slot per interval per date', () => {
    const s = eventSlots(ev);
    expect(s).toHaveLength(8);
    expect(s[1] - s[0]).toBe(30);
  });
});

describe('buildGrid', () => {
  it('lays out in the event timezone', () => {
    const g = buildGrid(ev, 'Asia/Manila');
    expect(g.columns).toEqual(['2026-10-20', '2026-10-21']);
    expect(g.rows).toEqual([540, 570, 600, 630]);
    expect(g.cells.flat().every((c) => c !== null)).toBe(true);
  });

  it('shifts rows and splits dates for a far timezone', () => {
    // 9-11 AM Manila = 6-8 PM previous day in Los Angeles (PDT, UTC-7).
    const g = buildGrid(ev, 'America/Los_Angeles');
    expect(g.columns).toEqual(['2026-10-19', '2026-10-20']);
    expect(g.rows).toEqual([18 * 60, 18 * 60 + 30, 19 * 60, 19 * 60 + 30]);
  });
});
