# Davar Web Deploy

## Option A — Vercel (recommended for the PWA)

1. From the `web/` folder, connect the repo to Vercel (Root Directory: `web`)
2. Set environment variables:
   - `OPENAI_API_KEY` (or `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`) for AI playlists + OpenAI TTS
   - `EXPO_PUBLIC_BIBLE_API_KEY` / `VITE_BIBLE_API_KEY` for NIV (optional)
3. Deploy. Serverless routes under `web/api/*` handle AI/TTS.

```bash
cd web
npx vercel --prod
```

## Option B — Backend hosts the built PWA

```bash
cd web && npm install && npm run build
cd ../backend && npm install && npm start
```

The Express server serves `web/dist` and exposes `/api/ai`, `/api/tts`, and analytics.

## Option C — Netlify

Root directory `web`, build `npm run build`, publish `dist`. Configure the same env vars.

## Local development

```bash
cd web
npm install
npm run dev
```

Vite middleware serves `/api/*` using keys from the repo `.env`.

## Sync Bible data from native

```bash
bash scripts/sync-web-bible.sh
```

No pricing or account tiers — the web app is fully available once deployed.
