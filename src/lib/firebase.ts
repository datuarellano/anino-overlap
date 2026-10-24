import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FB_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FB_APP_ID as string | undefined,
};

export const isConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function init() {
  if (!isConfigured) throw new Error('Firebase is not configured. See README.');
  if (!app) {
    app = initializeApp(config);
    auth = getAuth(app);
    // Safari (and some proxies) stall Firestore's streaming transport for many seconds
    // before falling back; auto-detect switches to long polling quickly instead.
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  }
}

export function getDb(): Firestore {
  init();
  return db!;
}

let userPromise: Promise<User> | null = null;

/** Resolves with this browser's anonymous Firebase user, signing in on first use. */
export function ensureUser(): Promise<User> {
  init();
  if (!userPromise) {
    userPromise = new Promise<User>((resolve, reject) => {
      const unsub = onAuthStateChanged(
        auth!,
        (u) => {
          if (u) {
            unsub();
            resolve(u);
          } else {
            signInAnonymously(auth!).catch((e) => {
              unsub();
              userPromise = null;
              reject(e);
            });
          }
        },
        (e) => {
          userPromise = null;
          reject(e);
        },
      );
    });
  }
  return userPromise;
}
