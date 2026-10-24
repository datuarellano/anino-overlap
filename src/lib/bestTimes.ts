import type { Participant } from './types';

export interface TimeBlock {
  /** UTC epoch minutes, inclusive start. */
  start: number;
  /** UTC epoch minutes, exclusive end. */
  end: number;
  available: string[];
  missing: string[];
}

/**
 * Merge consecutive slots with the same set of available people into blocks,
 * then rank by headcount, then length, then earliest.
 */
export function bestTimes(slots: number[], slotMin: number, people: Participant[], limit = 5): TimeBlock[] {
  if (!people.length) return [];
  const sets = people.map((p) => new Set(p.slots));
  const blocks: TimeBlock[] = [];
  let cur: { start: number; end: number; key: string; idx: number[] } | null = null;

  const flush = () => {
    if (cur && cur.idx.length) {
      const inSet = new Set(cur.idx);
      blocks.push({
        start: cur.start,
        end: cur.end,
        available: cur.idx.map((i) => people[i].name),
        missing: people.filter((_, i) => !inSet.has(i)).map((p) => p.name),
      });
    }
    cur = null;
  };

  for (const s of slots) {
    const idx: number[] = [];
    sets.forEach((set, i) => set.has(s) && idx.push(i));
    const key = idx.join(',');
    if (cur && cur.end === s && cur.key === key) {
      cur.end = s + slotMin;
    } else {
      flush();
      cur = { start: s, end: s + slotMin, key, idx };
    }
  }
  flush();

  return blocks
    .sort(
      (a, b) =>
        b.available.length - a.available.length || b.end - b.start - (a.end - a.start) || a.start - b.start,
    )
    .slice(0, limit);
}
