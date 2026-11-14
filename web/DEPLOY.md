# Deploy Davar Web (Vercel + Railway)

Architecture:

- **Front end:** Vite React PWA on **Vercel** (`web/`)
- **Backend:** Express + SQLite on **Railway** (`backend/`) — auth, playlists, analytics, AI, TTS

Users can **Sign in**, **Sign up**, or **Continue without an account**. No pricing tiers.

## 1. Railway (backend)

1. Create a project at [railway.app](https://railway.app)
2. Deploy backend: set Railway **Root Directory** to `backend`, **or** leave root as the repo and use the root `Dockerfile` / `railway.toml` (they build from `backend/`).
3. Set environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | yes | Long random string |
| `OPENAI_API_KEY` | yes for AI/TTS | Server-only |
| `CORS_ORIGIN` | recommended | Your Vercel URL, e.g. `https://davar.vercel.app` |
| `DATABASE_PATH` | recommended | e.g. `/data/scripture.db` with a Railway volume mounted at `/data` |
| `PORT` | auto | Railway sets this |

4. Copy the public HTTPS URL (e.g. `https://your-service.up.railway.app`)

See also [`../backend/README.md`](../backend/README.md).

## 2. Vercel (front end)

1. Import this GitHub repo in [Vercel](https://vercel.com)
2. Set **Root Directory** to `web`
3. Add environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | yes | Railway public URL (no trailing slash) |
| `VITE_BIBLE_API_KEY` | no | Enables NIV from api.bible |

4. Deploy

```bash
cd web
npx vercel --prod
```

Optional: keep `web/api/*` as same-origin fallbacks; the app prefers `VITE_API_URL` for all API calls.

**If Railway build fails on `better-sqlite3` / Node 24:** pull the latest `backend/` (uses sql.js, no native compile), set service **Root Directory** to `backend`, prefer **Dockerfile** builder, then redeploy.

## 3. Local development

```bash
# Terminal 1 — Railway-compatible API
cd backend
cp .env.example .env   # or edit existing .env
npm install
npm run dev

# Terminal 2 — Vite PWA
cp web/.env.example web/.env.local
# set VITE_API_URL=http://localhost:3000
cd web
npm install
npm run dev
```

## 4. Verify

- `GET {RAILWAY_URL}/health` returns `{ "status": "ok" }`
- Sign up / sign in works from the web app
- Create a playlist while signed in → appears after refresh on another device
- Guest skip still works (local-only playlists)
- Listen Mode generates OpenAI audio when `OPENAI_API_KEY` is set on Railway
