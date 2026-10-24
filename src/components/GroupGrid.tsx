import type { PointerEvent } from 'react';
import type { Grid } from '../lib/slots';
import { TimeGrid, cellAt } from './TimeGrid';

interface Props {
  grid: Grid;
  counts: Map<number, number>;
  total: number;
  active: number | null;
  onActive: (slot: number | null) => void;
  /** When set, slots outside this set are dimmed. */
  focus: Set<number> | null;
}

export function heatColor(count: number, total: number): string {
  if (!count || !total) return 'var(--cell-empty)';
  const pct = Math.round(18 + (82 * count) / total);
  return `color-mix(in srgb, var(--accent) ${pct}%, var(--cell-empty))`;
}

export function GroupGrid({ grid, counts, total, active, onActive, focus }: Props) {
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const pos = cellAt(e.target as Element);
    onActive(pos ? grid.cells[pos.c][pos.r] : null);
  };

  return (
    <TimeGrid
      grid={grid}
      variant="group"
      onPointerMove={(e) => e.pointerType === 'mouse' && pick(e)}
      onPointerDown={pick}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onActive(null)}
      cellStyle={(slot) => ({ background: heatColor(counts.get(slot!) ?? 0, total) })}
      cellClass={(slot) => {
        if (slot === null) return '';
        let cls = '';
        if (slot === active) cls += ' active';
        if (focus && !focus.has(slot)) cls += ' dim';
        return cls;
      }}
    />
  );
}
