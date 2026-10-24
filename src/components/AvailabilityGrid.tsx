import { useRef, useState, type PointerEvent } from 'react';
import type { Grid } from '../lib/slots';
import { TimeGrid, cellAt } from './TimeGrid';

interface Props {
  grid: Grid;
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}

interface Drag {
  anchor: { c: number; r: number };
  cur: { c: number; r: number };
  add: boolean;
  pointerId: number;
}

/** Click or drag a rectangle to mark slots; starting on a marked slot erases instead. */
export function AvailabilityGrid({ grid, selected, onChange }: Props) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const update = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const inRect = (d: Drag, c: number, r: number) =>
    c >= Math.min(d.anchor.c, d.cur.c) &&
    c <= Math.max(d.anchor.c, d.cur.c) &&
    r >= Math.min(d.anchor.r, d.cur.r) &&
    r <= Math.max(d.anchor.r, d.cur.r);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || dragRef.current) return;
    const pos = cellAt(e.target as Element);
    if (!pos) return;
    const slot = grid.cells[pos.c][pos.r];
    if (slot === null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    update({ anchor: pos, cur: pos, add: !selected.has(slot), pointerId: e.pointerId });
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const pos = cellAt(document.elementFromPoint(e.clientX, e.clientY));
    if (!pos || (pos.c === d.cur.c && pos.r === d.cur.r)) return;
    update({ ...d, cur: pos });
  };

  const finish = (e: PointerEvent<HTMLDivElement>, commit: boolean) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    update(null);
    if (!commit) return;
    const next = new Set(selected);
    for (let c = 0; c < grid.columns.length; c++) {
      for (let r = 0; r < grid.rows.length; r++) {
        const slot = grid.cells[c][r];
        if (slot === null || !inRect(d, c, r)) continue;
        if (d.add) next.add(slot);
        else next.delete(slot);
      }
    }
    onChange(next);
  };

  return (
    <TimeGrid
      grid={grid}
      variant="mine"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
      onContextMenu={(e) => e.preventDefault()}
      cellClass={(slot, c, r) => {
        if (slot === null) return '';
        if (drag && inRect(drag, c, r)) return drag.add ? 'preview-add' : 'preview-remove';
        return selected.has(slot) ? 'on' : '';
      }}
    />
  );
}
