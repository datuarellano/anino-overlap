import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ensureUser, getDb } from './firebase';
import { randomId, sha256Hex } from './hash';
import type { EventDoc, Participant } from './types';

export class WrongPasswordError extends Error {
  constructor() {
    super('That name is taken and the password does not match.');
  }
}

export function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Returns an error message, or null if the name is usable as a document id. */
export function validateName(name: string): string | null {
  const key = nameKey(name);
  if (!key) return 'Enter your name.';
  if (key.length > 40) return 'Keep it under 40 characters.';
  if (key.includes('/')) return 'Names cannot contain "/".';
  if (key === '.' || key === '..' || /^__.*__$/.test(key)) return 'Pick a different name.';
  return null;
}

function isPermissionDenied(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'permission-denied';
}

export type NewEvent = Omit<EventDoc, 'id' | 'creatorUid'>;

export async function createEvent(input: NewEvent): Promise<string> {
  const user = await ensureUser();
  const id = randomId(10);
  await setDoc(doc(getDb(), 'events', id), {
    ...input,
    creatorUid: user.uid,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function getEvent(id: string): Promise<EventDoc | null> {
  await ensureUser();
  const snap = await getDoc(doc(getDb(), 'events', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id,
    title: d.title,
    timezone: d.timezone,
    dates: d.dates,
    startMin: d.startMin,
    endMin: d.endMin,
    slotMin: d.slotMin,
    creatorUid: d.creatorUid,
  };
}

/**
 * Sign in to an event as `name`. New names are created with the given password
 * (blank = no password). Existing names require the matching password.
 */
export async function joinEvent(eventId: string, name: string, password: string): Promise<string> {
  const user = await ensureUser();
  const db = getDb();
  const key = nameKey(name);
  const pwHash = password ? await sha256Hex(`${eventId}:${key}:${password}`) : '';
  const pRef = doc(db, 'events', eventId, 'participants', key);
  const sRef = doc(db, 'events', eventId, 'secrets', key);
  const cRef = doc(db, 'events', eventId, 'claims', `${key}_${user.uid}`);

  const existing = await getDoc(pRef);
  try {
    if (!existing.exists()) {
      const batch = writeBatch(db);
      batch.set(pRef, { name: name.trim().replace(/\s+/g, ' '), slots: [], updatedAt: serverTimestamp() });
      batch.set(sRef, { pwHash });
      batch.set(cRef, { pwHash });
      await batch.commit();
    } else {
      await setDoc(cRef, { pwHash });
    }
  } catch (e) {
    if (isPermissionDenied(e)) throw new WrongPasswordError();
    throw e;
  }
  return key;
}

export async function saveSlots(eventId: string, key: string, slots: number[]): Promise<void> {
  await updateDoc(doc(getDb(), 'events', eventId, 'participants', key), {
    slots: [...slots].sort((a, b) => a - b),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeParticipants(
  eventId: string,
  onChange: (people: Participant[]) => void,
  onError: (e: Error) => void,
): () => void {
  return onSnapshot(
    collection(getDb(), 'events', eventId, 'participants'),
    (snap) => {
      const people = snap.docs
        .map((d) => ({ key: d.id, name: d.data().name as string, slots: (d.data().slots as number[]) ?? [] }))
        .sort((a, b) => a.name.localeCompare(b.name));
      onChange(people);
    },
    onError,
  );
}
