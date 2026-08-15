# Deploy Davar Web (Vercel + Supabase)

Architecture:

- **Front end:** Vite React PWA on **Vercel** (`web/`)
- **Data backend:** **Supabase** (playlists + analytics)
- **AI / TTS:** Vercel serverless routes (`web/api/ai`, `web/api/tts`) so OpenAI keys stay off the client

No Sign In UI and no pricing tiers. The app uses Supabase **anonymous auth** under the hood so each browser gets a secure user id for Row Level Security.

## 1. Supabase

Follow [`supabase/README.md`](../supabase/README.md):

1. Create project
2. Run SQL migration `supabase/migrations/20260815000000_init_davar.sql`
3. Enable **Anonymous** provider
4. Copy Project URL + anon key

## 2. Vercel

1. Import this GitHub repo in [Vercel](https://vercel.com)
2. Set **Root Directory** to `web`
3. Add environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | yes | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `OPENAI_API_KEY` | yes for AI/TTS | Server-only |
| `VITE_BIBLE_API_KEY` | no | Enables NIV |

4. Deploy

```bash
cd web
npx vercel --prod
```

## 3. Local development

```bash
cp web/.env.example web/.env.local
# fill in Supabase + OpenAI values

cd web
npm install
npm run dev
```

Vite still proxies `/api/ai` and `/api/tts` in dev via `vite.apiPlugin.ts` (reads repo `.env`).

## 4. Verify

- Create a playlist → appears in Supabase Table Editor → `playlists`
- Refresh the site → playlist still there (hydrated from Supabase)
- Listen Mode generates OpenAI audio when `OPENAI_API_KEY` is set
