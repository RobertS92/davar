# Davar Backend (Railway)

Express + SQLite (via **sql.js**, pure WASM — no native compile) for auth, playlist sync, analytics, AI, and TTS.

## Features

- Email/password auth (JWT)
- Playlist cloud sync
- Analytics event ingest + admin summary
- OpenAI chat + TTS proxies (`/api/ai`, `/api/tts`)
- Optional static hosting of `web/dist` if present

## Quick Start (local)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Server: `http://localhost:3000` · Health: `GET /health`

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | yes (prod) | Sign access/refresh tokens |
| `OPENAI_API_KEY` | for AI/TTS | Also accepts `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` |
| `CORS_ORIGIN` | recommended | Comma-separated Vercel + local origins |
| `DATABASE_PATH` | recommended | e.g. `/data/scripture.db` with a volume at `/data` |
| `PORT` | auto | Railway injects this |

## Deploy on Railway

1. Create a project at [railway.app](https://railway.app)
2. New service → deploy from this repo with **Root Directory** = `backend`
3. Add a **Volume** mounted at `/data` (keeps SQLite across deploys)
4. Set `JWT_SECRET`, `OPENAI_API_KEY`, `CORS_ORIGIN`, `DATABASE_PATH=/data/scripture.db`
5. Deploy — copy the public HTTPS URL into the web app as `VITE_API_URL`

Dockerfile + `railway.toml` are included. The DB uses **sql.js** (no `better-sqlite3` native build), so Railpack/Nixpacks on Node 24 also works.

If Railway shows a Railpack build instead of Docker: open the service → **Settings** → **Build** → set **Builder** to **Dockerfile**, with Root Directory `backend`. Then redeploy.

CLI alternative:

```bash
cd backend
railway login
railway init
railway up
```

## API

### Auth
- `POST /auth/signup` `{ email, password, displayName? }`
- `POST /auth/signin` `{ email, password }`
- `POST /auth/signout` (Bearer)
- `GET /auth/verify` (Bearer)

### Playlists (Bearer)
- `GET /playlists`
- `POST /playlists/sync` `{ playlist }`
- `DELETE /playlists/:id`

### Analytics
- `POST /analytics/events` / `POST /api/analytics/events`
- `GET /analytics/summary`

### AI / TTS
- `POST /api/ai`
- `POST /api/tts`
- `GET /api/tts/health`

### Health
- `GET /health`

## Connect clients

Web (`web/.env.local` / Vercel):

```
VITE_API_URL=https://your-service.up.railway.app
```

Native Expo (repo root `.env`):

```
EXPO_PUBLIC_API_URL=https://your-service.up.railway.app
```

## Admin dashboard

Open `admin.html` locally (point it at your Railway URL) for usage summaries.

## Notes

- Change `JWT_SECRET` before production traffic
- Prefer a Railway volume for `DATABASE_PATH` so user data survives redeploys
- No pricing tiers — free guest use + optional signed-in sync
