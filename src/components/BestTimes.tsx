import type { TimeBlock } from '../lib/bestTimes';
import { formatDate, formatMinutes, localDateMin } from '../lib/time';

interface Props {
  blocks: TimeBlock[];
  total: number;
  tz: string;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export function describeBlock(b: TimeBlock, tz: string): string {
  const s = localDateMin(b.start * 60000, tz);
  const e = localDateMin(b.end * 60000, tz);
  const endLabel = e.date !== s.date && e.min === 0 ? 'midnight' : formatMinutes(e.min);
  return `${formatDate(s.date)} · ${formatMinutes(s.min)} – ${endLabel}`;
}

function duration(b: TimeBlock): string {
  const m = b.end - b.start;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function BestTimes({ blocks, total, tz, selected, onSelect }: Props) {
  if (!blocks.length) {
    return <div className="empty">Best times appear here once people add their availability.</div>;
  }
  return (
    <ol className="best-list">
      {blocks.map((b, i) => {
        const full = b.available.length === total;
        return (
          <li key={`${b.start}-${b.end}`}>
            <button
              type="button"
              className={'best-item' + (full ? ' full' : '')}
              aria-pressed={selected === i}
              onClick={() => onSelect(selected === i ? null : i)}
            >
              <span className="best-rank">
                {b.available.length}/{total}
              </span>
              <span className="best-when">{describeBlock(b, tz)}</span>
              <span className="best-who">
                {duration(b)} · {full ? 'Everyone is free' : `Missing ${b.missing.join(', ')}`}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
