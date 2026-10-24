import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPicker } from '../components/CalendarPicker';
import { TimezoneSelect } from '../components/TimezoneSelect';
import { createEvent } from '../lib/api';
import { getRecentEvents, rememberEvent } from '../lib/session';
import { browserTimezone, formatMinutes, isoDate, localDateMin } from '../lib/time';

const HOURS = Array.from({ length: 25 }, (_, h) => h * 60);

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

function hourLabel(min: number): string {
  if (min === 1440) return 'Midnight';
  if (min === 720) return 'Noon';
  return formatMinutes(min, true);
}

export function CreateEvent() {
  const navigate = useNavigate();
  const [timezone, setTimezone] = useState(browserTimezone);
  const today = useMemo(() => localDateMin(Date.now(), timezone).date, [timezone]);
  const [title, setTitle] = useState('');
  const [dates, setDates] = useState<Set<string>>(() => {
    const t = localDateMin(Date.now(), browserTimezone()).date;
    return new Set(Array.from({ length: 7 }, (_, i) => addDays(t, i)));
  });
  const [startMin, setStartMin] = useState(9 * 60);
  const [endMin, setEndMin] = useState(21 * 60);
  const [slotMin, setSlotMin] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recent = useMemo(getRecentEvents, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Give your event a name.');
    if (!dates.size) return setError('Pick at least one date.');
    if (dates.size > 62) return setError('Pick at most 62 dates.');
    if (startMin >= endMin) return setError('The end time must be after the start time.');
    setBusy(true);
    try {
      const id = await createEvent({
        title: title.trim().slice(0, 120),
        timezone,
        dates: [...dates].sort(),
        startMin,
        endMin,
        slotMin,
      });
      rememberEvent(id, title.trim());
      navigate(`/e/${id}`);
    } catch (err) {
      console.error(err);
      setError('Could not create the event. Check your connection and try again.');
      setBusy(false);
    }
  };

  const quick = (days: number) => setDates(new Set(Array.from({ length: days }, (_, i) => addDays(today, i))));
  const weekends = () => {
    const out = new Set<string>();
    for (let i = 0; i < 28; i++) {
      const d = addDays(today, i);
      const wd = new Date(d + 'T00:00:00Z').getUTCDay();
      if (wd === 0 || wd === 6) out.add(d);
    }
    setDates(out);
  };

  return (
    <>
      <section className="hero">
        <h1>Find a time that works.</h1>
        <p>Pick some dates, share the link, and everyone paints when they're free. The best overlap rises to the top.</p>
      </section>

      <form className="create-layout" onSubmit={submit}>
        <div className="card">
          <div className="field">
            <label htmlFor="title">Event name</label>
            <input
              id="title"
              className="input input-lg"
              placeholder="Anino catch-up"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <div className="row">
              <span className="label grow">
                Dates · <span className="faint">{dates.size} selected</span>
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => quick(7)}>
                Next 7 days
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={weekends}>
                Weekends
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDates(new Set())}>
                Clear
              </button>
            </div>
            <CalendarPicker selected={dates} onChange={setDates} today={today} />
            <p className="hint" style={{ margin: 0 }}>
              Tap or drag across days to select them.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="field">
            <span className="label">Between</span>
            <div className="time-range">
              <select className="select" value={startMin} onChange={(e) => setStartMin(Number(e.target.value))} aria-label="Earliest time">
                {HOURS.slice(0, 24).map((m) => (
                  <option key={m} value={m}>
                    {hourLabel(m)}
                  </option>
                ))}
              </select>
              <span className="muted">to</span>
              <select className="select" value={endMin} onChange={(e) => setEndMin(Number(e.target.value))} aria-label="Latest time">
                {HOURS.slice(1).map((m) => (
                  <option key={m} value={m}>
                    {hourLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <span className="label">Slot length</span>
            <div className="segmented" role="group" aria-label="Slot length">
              {[15, 30, 60].map((m) => (
                <button key={m} type="button" aria-pressed={slotMin === m} onClick={() => setSlotMin(m)}>
                  {m === 60 ? '1 hour' : `${m} min`}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="tz">Timezone</label>
            <TimezoneSelect id="tz" value={timezone} onChange={setTimezone} />
          </div>

          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary btn-block" style={{ height: 48, marginTop: 4 }} disabled={busy}>
            {busy ? 'Creating…' : 'Create event'}
          </button>

          {recent.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <span className="label">Recent events</span>
              <ul className="recent-list" style={{ marginTop: 8 }}>
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link to={`/e/${r.id}`}>
                      <span>{r.title}</span>
                      <span className="faint">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </>
  );
}
