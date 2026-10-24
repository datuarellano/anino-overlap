import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AvailabilityGrid } from '../components/AvailabilityGrid';
import { BestTimes, describeBlock } from '../components/BestTimes';
import { GroupGrid, heatColor } from '../components/GroupGrid';
import { SignIn } from '../components/SignIn';
import { TimezoneSelect } from '../components/TimezoneSelect';
import { getEvent, nameKey, saveSlots, subscribeParticipants } from '../lib/api';
import { bestTimes } from '../lib/bestTimes';
import { getSessionName, rememberEvent, setSessionName } from '../lib/session';
import { buildGrid, eventSlots } from '../lib/slots';
import { browserTimezone, formatDate, formatMinutes, localDateMin } from '../lib/time';
import type { EventDoc, Participant } from '../lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type Tab = 'mine' | 'group';

const SAVE_DELAY_MS = 600;

export function EventPage() {
  const { id = '' } = useParams();
  const [event, setEvent] = useState<EventDoc | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [people, setPeople] = useState<Participant[]>([]);
  const [viewTz, setViewTz] = useState(browserTimezone);
  const [me, setMe] = useState<{ key: string; name: string } | null>(() => {
    const n = getSessionName(id);
    return n ? { key: nameKey(n), name: n } : null;
  });
  const [mySlots, setMySlots] = useState<Set<number> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [tab, setTab] = useState<Tab>('mine');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [focusPerson, setFocusPerson] = useState<string | null>(null);
  const [focusBlock, setFocusBlock] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const saveTimer = useRef<number | undefined>(undefined);
  const pending = useRef(false);
  const editVersion = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getEvent(id)
      .then((ev) => {
        if (cancelled) return;
        setEvent(ev);
        if (ev) {
          rememberEvent(ev.id, ev.title);
          document.title = `${ev.title} · Overlap`;
        }
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setLoadError('Could not load this event. Check your connection and refresh.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!event) return;
    return subscribeParticipants(event.id, setPeople, (e) => {
      console.error(e);
      setLoadError('Lost connection to live updates. Refresh to reconnect.');
    });
  }, [event]);

  // Load my saved slots once they arrive; after that, local edits win until saved.
  useEffect(() => {
    if (!me || pending.current) return;
    const mine = people.find((p) => p.key === me.key);
    if (mine) setMySlots(new Set(mine.slots));
  }, [people, me]);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const signOut = () => {
    setSessionName(id, null);
    setMe(null);
    setMySlots(null);
    setSaveState('idle');
  };

  const changeSlots = (next: Set<number>) => {
    if (!me || !event) return;
    setMySlots(next);
    pending.current = true;
    const version = ++editVersion.current;
    setSaveState('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await saveSlots(event.id, me.key, [...next]);
        if (version !== editVersion.current) return; // a newer edit is queued
        pending.current = false;
        setSaveState('saved');
      } catch (e) {
        console.error(e);
        if (version !== editVersion.current) return;
        pending.current = false;
        setSaveState('error');
        if ((e as { code?: string }).code === 'permission-denied') {
          signOut();
          showToast('Please sign in again.');
        }
      }
    }, SAVE_DELAY_MS);
  };

  const grid = useMemo(() => (event ? buildGrid(event, viewTz) : null), [event, viewTz]);
  const allSlots = useMemo(() => (event ? eventSlots(event) : []), [event]);

  // Use my unsaved edits in the group view so it reacts instantly.
  const effectivePeople = useMemo(() => {
    if (!me || !mySlots) return people;
    return people.map((p) => (p.key === me.key ? { ...p, slots: [...mySlots] } : p));
  }, [people, me, mySlots]);

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of effectivePeople) for (const s of p.slots) m.set(s, (m.get(s) ?? 0) + 1);
    return m;
  }, [effectivePeople]);

  const blocks = useMemo(
    () => (event ? bestTimes(allSlots, event.slotMin, effectivePeople, 5) : []),
    [allSlots, event, effectivePeople],
  );

  const focus = useMemo(() => {
    if (focusBlock !== null && blocks[focusBlock]) {
      const b = blocks[focusBlock];
      return new Set(allSlots.filter((s) => s >= b.start && s < b.end));
    }
    if (focusPerson) {
      const p = effectivePeople.find((x) => x.key === focusPerson);
      return new Set(p?.slots ?? []);
    }
    return null;
  }, [focusBlock, focusPerson, blocks, allSlots, effectivePeople]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: event?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      // user cancelled share sheet, or clipboard blocked
    }
  };

  if (loadError && !event) {
    return (
      <div className="center-screen">
        <div>
          <p>{loadError}</p>
        </div>
      </div>
    );
  }
  if (event === undefined) {
    return (
      <div className="center-screen">
        <div>
          <div className="spinner" />
          <p className="muted">Loading event…</p>
        </div>
      </div>
    );
  }
  if (event === null || !grid) {
    return (
      <div className="center-screen">
        <div>
          <h2>Event not found</h2>
          <p className="muted">The link may be wrong, or the event was deleted.</p>
          <Link className="btn btn-primary" to="/">
            Create a new event
          </Link>
        </div>
      </div>
    );
  }

  const total = people.length;
  const first = event.dates[0];
  const last = event.dates[event.dates.length - 1];
  const activePeople = activeSlot === null ? null : effectivePeople.filter((p) => p.slots.includes(activeSlot));
  const activeLabel =
    activeSlot === null
      ? null
      : (() => {
          const s = localDateMin(activeSlot * 60000, viewTz);
          return `${formatDate(s.date)} · ${formatMinutes(s.min)} – ${formatMinutes(
            (s.min + event.slotMin) % 1440,
          )}`;
        })();

  return (
    <>
      <header className="event-head">
        <div className="grow">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <span>{first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`}</span>
            <span>
              {total} {total === 1 ? 'person' : 'people'} responded
            </span>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={share}>
          Share link
        </button>
      </header>

      <div className="toolbar">
        <span className="label">Showing times in</span>
        <TimezoneSelect value={viewTz} onChange={setViewTz} />
        {loadError && <span className="error">{loadError}</span>}
      </div>

      <div className="mobile-tabs">
        <div className="segmented" role="tablist">
          <button type="button" aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>
            {me ? 'My availability' : 'Sign in'}
          </button>
          <button type="button" aria-pressed={tab === 'group'} onClick={() => setTab('group')}>
            Group ({total})
          </button>
        </div>
      </div>

      <div className="event-layout" data-tab={tab}>
        <section className="card pane-mine">
          {me ? (
            <>
              <div className="pane-title">
                <h2>{me.name}'s availability</h2>
                <span className="save-status" data-state={saveState}>
                  <span className="dot" />
                  {saveState === 'saving'
                    ? 'Saving…'
                    : saveState === 'error'
                      ? 'Not saved'
                      : saveState === 'saved'
                        ? 'Saved'
                        : 'Synced'}
                </span>
              </div>
              <p className="hint">Tap or drag to mark when you're free. Start on a green slot to erase.</p>
              {mySlots ? (
                <AvailabilityGrid grid={grid} selected={mySlots} onChange={changeSlots} />
              ) : (
                <div className="empty">
                  <div className="spinner" />
                </div>
              )}
              <div className="row" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => changeSlots(new Set(allSlots))}
                  disabled={!mySlots}
                >
                  Select all
                </button>
                <button type="button" className="btn btn-sm" onClick={() => changeSlots(new Set())} disabled={!mySlots}>
                  Clear
                </button>
                <span className="grow" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
                  Not {me.name}?
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Add your availability</h2>
              <p className="sub">Sign in with just a name. No account needed.</p>
              <SignIn
                eventId={event.id}
                onSignedIn={(key, name) => {
                  setSessionName(event.id, name);
                  setMe({ key, name });
                }}
              />
            </>
          )}
        </section>

        <section className="card pane-group">
          <div className="pane-title">
            <h2>Group availability</h2>
          </div>
          <div className="legend">
            <span>0/{total}</span>
            <span className="legend-bar">
              {Array.from({ length: Math.max(total, 1) + 1 }, (_, i) => (
                <span key={i} style={{ background: heatColor(i, Math.max(total, 1)) }} />
              ))}
            </span>
            <span>
              {total}/{total} available
            </span>
          </div>
          <div className="slot-detail" aria-live="polite">
            {activeSlot === null || !activePeople ? (
              <span className="muted">
                {total ? 'Hover or tap a slot to see who is free.' : 'No responses yet. Share the link to get started.'}
              </span>
            ) : (
              <>
                <strong>
                  {activeLabel} · {activePeople.length}/{total}
                </strong>
                <div className="names">
                  {effectivePeople.map((p) => {
                    const ok = activePeople.includes(p);
                    return (
                      <span key={p.key} className={'chip' + (ok ? '' : ' out') + (me?.key === p.key ? ' me' : '')}>
                        {p.name}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <GroupGrid
            grid={grid}
            counts={counts}
            total={total}
            active={activeSlot}
            onActive={setActiveSlot}
            focus={focus}
          />
        </section>
      </div>

      <div className="event-side">
        <section className="card">
          <h2>Best times</h2>
          <p className="sub">Longest stretches with the most people free.</p>
          <BestTimes
            blocks={blocks}
            total={total}
            tz={viewTz}
            selected={focusBlock}
            onSelect={(i) => {
              setFocusBlock(i);
              setFocusPerson(null);
              if (i !== null) setTab('group');
            }}
          />
          {focusBlock !== null && blocks[focusBlock] && (
            <p className="hint" style={{ marginTop: 10 }}>
              Highlighting {describeBlock(blocks[focusBlock], viewTz)} on the group grid.
            </p>
          )}
        </section>
        <section className="card">
          <h2>People</h2>
          <p className="sub">Tap a name to see only their times.</p>
          {people.length ? (
            <div className="people">
              {effectivePeople.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={'chip' + (me?.key === p.key ? ' me' : '')}
                  aria-pressed={focusPerson === p.key}
                  onClick={() => {
                    setFocusPerson(focusPerson === p.key ? null : p.key);
                    setFocusBlock(null);
                  }}
                >
                  {p.name}
                  <span className="count">{p.slots.length ? `${((p.slots.length * event.slotMin) / 60).toFixed(1).replace(/\.0$/, '')}h` : 'none'}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">Nobody yet.</div>
          )}
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
