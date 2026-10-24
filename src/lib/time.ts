// Timezone helpers built on Intl, so no date library is needed.

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    dtfCache.set(tz, f);
  }
  return f;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function zonedParts(utcMs: number, tz: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(tz).formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return { year: out.year, month: out.month, day: out.day, hour: out.hour % 24, minute: out.minute };
}

/** Offset of `tz` from UTC at the given instant, in minutes (e.g. Asia/Manila = +480). */
export function tzOffsetMin(utcMs: number, tz: string): number {
  const p = zonedParts(utcMs, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(utcMs / 60000) * 60000) / 60000);
}

/** UTC epoch ms for wall-clock `minutes` after midnight on `date` (YYYY-MM-DD) in `tz`. */
export function zonedToUtc(date: string, minutes: number, tz: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const off1 = tzOffsetMin(guess, tz);
  let t = guess - off1 * 60000;
  const off2 = tzOffsetMin(t, tz);
  if (off2 !== off1) t = guess - off2 * 60000;
  return t;
}

export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Local calendar date and minute-of-day for an instant in `tz`. */
export function localDateMin(utcMs: number, tz: string): { date: string; min: number } {
  const p = zonedParts(utcMs, tz);
  return { date: isoDate(p.year, p.month, p.day), min: p.hour * 60 + p.minute };
}

export function formatMinutes(min: number, compact = false): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  if (compact) return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')}`;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dateInfo(date: string): { weekday: string; month: string; day: number } {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { weekday: WEEKDAYS[wd], month: MONTHS[m - 1], day: d };
}

export function formatDate(date: string): string {
  const i = dateInfo(date);
  return `${i.weekday}, ${i.month} ${i.day}`;
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function allTimezones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list && list.length) return list.includes('UTC') ? list : ['UTC', ...list];
  } catch {
    // fall through
  }
  return ['UTC', browserTimezone()];
}

export function tzLabel(tz: string, at = Date.now()): string {
  const off = tzOffsetMin(at, tz);
  const sign = off < 0 ? '-' : '+';
  const a = Math.abs(off);
  const hh = Math.floor(a / 60);
  const mm = a % 60;
  return `${tz.replace(/_/g, ' ')} (UTC${sign}${hh}${mm ? ':' + String(mm).padStart(2, '0') : ''})`;
}
