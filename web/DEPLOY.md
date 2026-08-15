# Deploy Davar Web (Vercel + Supabase)

Architecture:

- **Front end:** Vite React PWA on **Vercel** (`web/`)
- **Data + Auth backend:** **Supabase** (email auth, playlists, analytics)
- **AI / TTS:** Vercel serverless routes (`web/api/ai`, `web/api/tts`) so OpenAI keys stay off the client

Users can **Sign in**, **Sign up**, or **Continue without an account** (anonymous guest). No pricing tiers.

## 1. Supabase

Follow [`supabase/README.md`](../supabase/README.md):

1. Create project
2. Run SQL migration `supabase/migrations/20260815000000_init_davar.sql`
3. Enable **Email** auth (default) and **Anonymous** provider (for guest mode)
4. Optional: turn off email confirmation for faster local testing
5. Copy Project URL + anon key

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

- Sign up / sign in works
- Create a playlist → appears in Supabase `playlists` for that user
- Guest skip still works when Anonymous provider is enabled
- Listen Mode generates OpenAI audio when `OPENAI_API_KEY` is set
