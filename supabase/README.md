# Supabase Backend Setup

## 1. Create a project

1. Go to [https://supabase.com](https://supabase.com) and create a project (e.g. `davar`)
2. Open **SQL Editor** and run the migration in `supabase/migrations/20260815000000_init_davar.sql`
3. Enable **Anonymous sign-ins**:
   - Authentication → Providers → **Anonymous** → Enable
4. Copy keys from **Project Settings → API**:
   - Project URL
   - `anon` `public` key

There is **no Sign In / Sign Up UI** on web. The app signs in anonymously so playlists can sync securely under Row Level Security. No pricing tiers.

## 2. Environment variables

### Vercel (web app root directory = `web`)

| Name | Where | Purpose |
|------|--------|---------|
| `VITE_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel + local | Supabase anon key |
| `OPENAI_API_KEY` | Vercel (server only) | AI playlists + OpenAI TTS |
| `VITE_BIBLE_API_KEY` | optional | NIV via api.bible |

Locally, put the same values in `/workspace/.env` or `web/.env.local`.

## 3. Deploy front end on Vercel

1. Import the GitHub repo in Vercel
2. Set **Root Directory** to `web`
3. Framework: Vite (auto)
4. Add the env vars above
5. Deploy

AI/TTS stay on Vercel serverless routes (`web/api/*`). Playlists + analytics use Supabase.
