# Overlap

A small When2Meet-style scheduler for our collective. Create an event, share the link, and everyone paints the times they're free. The group heatmap and the "Best times" list update live.

- Static site on GitHub Pages (React + Vite + TypeScript)
- Data in Firebase Firestore (free Spark plan, never pauses)
- No accounts: each person signs in per event with a name and an optional password

## One-time Firebase setup (~10 minutes)

1. Go to <https://console.firebase.google.com> and create a project. Google Analytics is not needed.
2. **Authentication** → Get started → Sign-in method → enable **Anonymous**.
   Then under **Settings → Authorized domains**, add `<your-github-username>.github.io`.
3. **Firestore Database** → Create database → pick a region (e.g. `asia-southeast1`) → start in **production mode**.
4. **Firestore → Rules**: replace the contents with [`firestore.rules`](firestore.rules) from this repo and click **Publish**.
   (Or, with the Firebase CLI: `npx firebase-tools deploy --only firestore:rules --project <project-id>`.)
5. **Project settings** (gear icon) → *Your apps* → add a **Web** app. Copy these values from the config it shows:

   | Firebase config key | Environment variable |
   | --- | --- |
   | `apiKey` | `VITE_FB_API_KEY` |
   | `authDomain` | `VITE_FB_AUTH_DOMAIN` |
   | `projectId` | `VITE_FB_PROJECT_ID` |
   | `appId` | `VITE_FB_APP_ID` |

   These values are not secret (they ship in the page). The Firestore rules are what protect the data.

## Run locally

```sh
cp .env.example .env.local   # fill in the four values
npm install
npm run dev
```

`npm test` runs the unit tests and `npm run build` makes a production build in `dist/`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Repository **Settings → Secrets and variables → Actions**: add the four `VITE_FB_*` values as repository secrets.
3. Repository **Settings → Pages**: set *Source* to **GitHub Actions**.
4. Push to `main` (or run the workflow manually). The site appears at `https://<username>.github.io/<repo>/`.

The app uses hash URLs (`…/#/e/abc123`), so links keep working on refresh without any server config.

## How sign-in works

- On first visit Firebase gives the browser an invisible anonymous ID.
- Signing in to an event as a new name creates that person and stores a SHA-256 hash of the password. Hashes can't be read back from the database.
- Signing in as an existing name on another device works only with the same password. Names without a password can be used by anyone who types them, just like When2Meet.
- The Firestore rules only let a browser edit a person's times after it has proven the password.

This is meant for a trusted group, not for anything sensitive.

## Project layout

```
src/lib/time.ts         timezone math (Intl only, no date library)
src/lib/slots.ts        event → slot list → date × time grid in the viewer's timezone
src/lib/bestTimes.ts    ranks contiguous blocks by headcount and length
src/lib/api.ts          Firestore reads/writes and live subscription
src/components/         grids, calendar picker, sign-in, best times
src/pages/              create page and event page
firestore.rules         security rules
```

## Free tier headroom

Firestore's Spark plan allows 50,000 reads and 20,000 writes per day. A busy event with ten people uses a few hundred, so there is plenty of room. If a limit were ever hit, requests fail until the daily reset; nothing is billed.
