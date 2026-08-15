# Davar Web App

Browser version of Davar so you can use Scripture playlists on your phone **without TestFlight**.

The native Expo / React Native app in the repo root is unchanged. This web app lives in `/web`.

It includes its own copy of Bible types, verse parsing, and KJV text so the web build does not depend on Expo tooling. Keep those in sync with:

```bash
bash scripts/sync-web-bible.sh
```

## Features

- Mobile-app feel on phones (bottom tabs, safe areas, installable PWA)
- Desktop layout with sidebar navigation
- Stations, Modes, Deep Dive Study, Library
- Manual + AI playlist creation (OpenAI via `/api/ai`, curated fallback)
- Edit playlists (rename, reorder, add/remove)
- Listen Mode with OpenAI TTS voices, sleep timer, pause styles
- Read Mode (swipeable cards)
- NIV when a Bible API key is configured; KJV offline by default
- Offline audio download (IndexedDB cache)
- Analytics (local + optional backend)
- No accounts, pricing, or feature tiers on web

## Run locally

```bash
cd web
npm install
npm run dev
```

Then open the printed URL on your phone (same Wi‑Fi) or desktop.

### Install on iPhone (no TestFlight)

1. Open the site in Safari
2. Tap Share
3. Tap **Add to Home Screen**

## Build & deploy

```bash
cd web
npm run build
```

See [DEPLOY.md](./DEPLOY.md) for Vercel, Netlify, and backend hosting.
