# Davar Web App

Browser PWA for Scripture playlists — **no TestFlight**.

## Stack

| Layer | Service |
|-------|---------|
| Front end | Vite + React on **Vercel** |
| Data | **Supabase** (playlists, analytics) |
| AI / TTS | Vercel serverless (`/api/ai`, `/api/tts`) |

Native Expo app in the repo root is unchanged. No Sign In UI and no pricing tiers (anonymous Supabase session under the hood).

## Setup

1. Supabase: [`../supabase/README.md`](../supabase/README.md)
2. Env: copy `.env.example` → `.env.local`
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
