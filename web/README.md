# Davar Web App

Browser version of Davar so you can use Scripture playlists on your phone **without TestFlight**.

The native Expo / React Native app in the repo root is unchanged. This web app lives in `/web`.

It includes its own copy of Bible types, verse parsing, and KJV text so the web build does not depend on Expo tooling. Keep those in sync if you change the native data heavily.

## Features

- Mobile-app feel on phones (bottom tabs, safe areas, installable PWA)
- Desktop layout with sidebar navigation
- Stations, Modes, Library, manual + prompt playlist creation
- Listen Mode (Web Speech API) and Read Mode (swipeable cards)
- Preferences and playlists stored in the browser (localStorage)

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

### Install on Android

1. Open the site in Chrome
2. Tap the install / Add to Home Screen prompt

## Build

```bash
cd web
npm run build
npm run preview
```

Deploy the `web/dist` folder to any static host (Vercel, Netlify, Cloudflare Pages, S3, etc.).
