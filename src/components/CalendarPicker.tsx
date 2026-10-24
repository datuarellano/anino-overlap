import { useRef, useState, type PointerEvent } from 'react';
import { isoDate } from '../lib/time';

interface Props {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  today: string;
}

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Month calendar where you click or drag across days to toggle them. */
export function CalendarPicker({ selected, onChange, today }: Props) {
  const [ty, tm] = today.split('-').map(Number);
  const [view, setView] = useState({ y: ty, m: tm });
  const drag = useRef<{ add: boolean; seen: Set<string>; next: Set<string> } | null>(null);

  const first = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const daysIn = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(first).fill(null)];
  for (let d = 1; d <= daysIn; d++) cells.push(isoDate(view.y, view.m, d));

  const shift = (delta: number) => {
    const idx = view.y * 12 + (view.m - 1) + delta;
    setView({ y: Math.floor(idx / 12), m: (idx % 12) + 1 });
  };

  const dateFrom = (el: Element | null) => el?.closest<HTMLElement>('[data-date]')?.dataset.date ?? null;

  const apply = (date: string) => {
    const d = drag.current;
    if (!d || d.seen.has(date)) return;
    d.seen.add(date);
    if (d.add) d.next.add(date);
    else d.next.delete(date);
    onChange(new Set(d.next));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const date = dateFrom(e.target as Element);
    if (!date) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { add: !selected.has(date), seen: new Set(), next: new Set(selected) };
    apply(date);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const date = dateFrom(document.elementFromPoint(e.clientX, e.clientY));
    if (date) apply(date);
  };

  // Keyboard activation (pointer input is handled by the drag handlers above).
  const toggle = (date: string) => {
    const next = new Set(selected);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    onChange(next);
  };

  const end = () => {
    drag.current = null;
  };

  const atMin = view.y * 12 + view.m <= ty * 12 + tm;

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => shift(-1)} disabled={atMin} aria-label="Previous month">
          ‹
        </button>
        <strong>
          {MONTH_NAMES[view.m - 1]} {view.y}
        </strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Next month">
          ›
        </button>
      </div>
      <div
        className="calendar-grid"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {DOW.map((d) => (
          <div key={d} className="calendar-dow">
            {d}
          </div>
        ))}
        {cells.map((date, i) =>
          date ? (
            <button
              type="button"
              key={date}
              data-date={date}
              aria-pressed={selected.has(date)}
              onClick={(e) => e.detail === 0 && toggle(date)}
              className={
                'calendar-day' +
                (selected.has(date) ? ' is-selected' : '') +
                (date === today ? ' is-today' : '') +
                (date < today ? ' is-past' : '')
              }
            >
              {Number(date.slice(8))}
            </button>
          ) : (
            <div key={`b${i}`} className="calendar-day is-blank" />
          ),
        )}
      </div>
    </div>
  );
}
