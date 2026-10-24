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
    // Safari stalls Firestore's streaming transport for many seconds before falling back,
    // so skip the probe there. Elsewhere auto-detect covers proxies that break streaming.
    const ua = navigator.userAgent;
    const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
    db = initializeFirestore(
      app,
      safari ? { experimentalForceLongPolling: true } : { experimentalAutoDetectLongPolling: true },
    );
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

/** Warm up auth and the Firestore connection while the user is still typing. */
export function preconnect(): void {
  if (isConfigured) ensureUser().catch(() => {});
}
