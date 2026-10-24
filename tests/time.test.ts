import { describe, expect, it } from 'vitest';
import { localDateMin, tzOffsetMin, zonedToUtc } from '../src/lib/time';

describe('zonedToUtc', () => {
  it('converts Manila wall time to UTC', () => {
    expect(new Date(zonedToUtc('2026-10-20', 9 * 60, 'Asia/Manila')).toISOString()).toBe('2026-10-20T01:00:00.000Z');
  });

  it('handles the US DST switch', () => {
    // 2026-03-08: New York jumps from UTC-5 to UTC-4 at 2 AM.
    expect(new Date(zonedToUtc('2026-03-08', 60, 'America/New_York')).toISOString()).toBe('2026-03-08T06:00:00.000Z');
    expect(new Date(zonedToUtc('2026-03-08', 4 * 60, 'America/New_York')).toISOString()).toBe('2026-03-08T08:00:00.000Z');
  });

  it('round-trips through localDateMin', () => {
    const t = zonedToUtc('2026-10-25', 21 * 60 + 30, 'Asia/Manila');
    expect(localDateMin(t, 'Asia/Manila')).toEqual({ date: '2026-10-25', min: 21 * 60 + 30 });
    expect(localDateMin(t, 'UTC')).toEqual({ date: '2026-10-25', min: 13 * 60 + 30 });
  });
});

describe('tzOffsetMin', () => {
  it('reports fixed and half-hour offsets', () => {
    expect(tzOffsetMin(Date.UTC(2026, 0, 1), 'Asia/Manila')).toBe(480);
    expect(tzOffsetMin(Date.UTC(2026, 0, 1), 'Asia/Kolkata')).toBe(330);
  });
});
