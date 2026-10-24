import type { EventDoc } from './types';
import { localDateMin, zonedToUtc } from './time';

/** All slot starts for an event, as UTC epoch minutes, sorted. */
export function eventSlots(ev: Pick<EventDoc, 'dates' | 'startMin' | 'endMin' | 'slotMin' | 'timezone'>): number[] {
  const out = new Set<number>();
  for (const date of ev.dates) {
    for (let m = ev.startMin; m < ev.endMin; m += ev.slotMin) {
      out.add(Math.round(zonedToUtc(date, m, ev.timezone) / 60000));
    }
  }
  return [...out].sort((a, b) => a - b);
}

export interface Grid {
  /** Local dates (YYYY-MM-DD) in the viewing timezone, one per column. */
  columns: string[];
  /** Minute-of-day values in the viewing timezone, one per row. */
  rows: number[];
  /** cells[col][row] = slot id (UTC epoch minutes) or null when that cell isn't part of the event. */
  cells: (number | null)[][];
  slotMin: number;
}

/** Lay the event's slots out as a date × time grid in the viewer's timezone. */
export function buildGrid(ev: EventDoc, viewTz: string): Grid {
  const slots = eventSlots(ev);
  const byKey = new Map<string, number>();
  const cols = new Set<string>();
  const rows = new Set<number>();
  for (const s of slots) {
    const { date, min } = localDateMin(s * 60000, viewTz);
    cols.add(date);
    rows.add(min);
    byKey.set(`${date}|${min}`, s);
  }
  const columns = [...cols].sort();
  const rowList = [...rows].sort((a, b) => a - b);
  const cells = columns.map((c) => rowList.map((r) => byKey.get(`${c}|${r}`) ?? null));
  return { columns, rows: rowList, cells, slotMin: ev.slotMin };
}
