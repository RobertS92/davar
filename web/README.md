# Davar Web App

Browser PWA for Scripture playlists — **no TestFlight**.

## Stack

| Layer | Service |
|-------|---------|
| Front end | Vite + React on **Vercel** |
| Backend | Express + SQLite on **Railway** (auth, playlists, analytics, AI/TTS) |

Native Expo app in the repo root is unchanged. Users can sign in, sign up, or continue as a guest. No pricing tiers.

## Setup

1. Railway backend: [`../backend/README.md`](../backend/README.md)
2. Env: copy `.env.example` → `.env.local` and set `VITE_API_URL`
3. Deploy: [`DEPLOY.md`](./DEPLOY.md)

## Run locally

```bash
npm install
npm run dev
```

## Sync Bible data from native

```bash
bash ../scripts/sync-web-bible.sh
```
