import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { Grid } from '../lib/slots';
import { dateInfo, formatMinutes } from '../lib/time';

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  grid: Grid;
  variant: 'mine' | 'group';
  cellClass: (slot: number | null, col: number, row: number) => string;
  cellStyle?: (slot: number | null) => CSSProperties | undefined;
  cellContent?: (slot: number | null) => ReactNode;
}

function rowHeight(slotMin: number): number {
  if (slotMin <= 15) return 15;
  if (slotMin <= 30) return 22;
  return 36;
}

/** Shared date × time layout used by both the personal and the group grid. */
export function TimeGrid({ grid, variant, cellClass, cellStyle, cellContent, ...rest }: Props) {
  const { columns, rows, cells, slotMin } = grid;
  const style = { '--cols': columns.length, '--row-h': `${rowHeight(slotMin)}px` } as CSSProperties;

  return (
    <div className="grid-scroll">
      <div className="tgrid" style={style} {...rest}>
        <div className="tgrid-corner" />
        {columns.map((d) => {
          const i = dateInfo(d);
          return (
            <div key={d} className="tgrid-colhead">
              <div className="dow">{i.weekday}</div>
              <div className="md">
                {i.month} {i.day}
              </div>
            </div>
          );
        })}
        {rows.map((min, r) => {
          const gap = r > 0 && min - rows[r - 1] !== slotMin;
          const showLabel = r === 0 || gap || min % 60 === 0;
          const lineCls = min % 60 === 0 ? ' hour-start' : min % 30 === 0 ? ' half-start' : '';
          return (
            <div key={min} className="tgrid-body" role="row">
              <div className="tgrid-rowhead">{showLabel ? formatMinutes(min, true) : ''}</div>
              {columns.map((_, c) => {
                const slot = cells[c][r];
                const cls =
                  `cell ${variant}` +
                  lineCls +
                  (gap ? ' gap-before' : '') +
                  (c === columns.length - 1 ? ' last-col' : '') +
                  (r === rows.length - 1 ? ' last-row' : '') +
                  (slot === null ? ' off' : '') +
                  ' ' +
                  cellClass(slot, c, r);
                return (
                  <div
                    key={c}
                    className={cls}
                    data-c={c}
                    data-r={r}
                    style={slot === null ? undefined : cellStyle?.(slot)}
                  >
                    {cellContent?.(slot)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function cellAt(el: Element | null): { c: number; r: number } | null {
  const cell = el?.closest<HTMLElement>('[data-c]');
  if (!cell) return null;
  return { c: Number(cell.dataset.c), r: Number(cell.dataset.r) };
}
