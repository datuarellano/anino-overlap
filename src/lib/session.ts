// Per-browser conveniences only; the source of truth is Firestore.

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; ignore
  }
}

export function getSessionName(eventId: string): string | null {
  return read<string | null>(`overlap:name:${eventId}`, null);
}

export function setSessionName(eventId: string, name: string | null): void {
  write(`overlap:name:${eventId}`, name);
}

export interface RecentEvent {
  id: string;
  title: string;
  visitedAt: number;
}

export function getRecentEvents(): RecentEvent[] {
  return read<RecentEvent[]>('overlap:recent', []);
}

export function rememberEvent(id: string, title: string): void {
  const list = getRecentEvents().filter((e) => e.id !== id);
  list.unshift({ id, title, visitedAt: Date.now() });
  write('overlap:recent', list.slice(0, 8));
}

export function forgetEvent(id: string): void {
  write('overlap:recent', getRecentEvents().filter((e) => e.id !== id));
}
