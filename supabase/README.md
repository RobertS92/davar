# Supabase Backend Setup

## 1. Create a project

1. Go to [https://supabase.com](https://supabase.com) and create a project (e.g. `davar`)
2. Open **SQL Editor** and run the migration in `supabase/migrations/20260815000000_init_davar.sql`
3. Enable auth providers:
   - **Email** (on by default) — used for Sign In / Sign Up
   - **Anonymous** (Authentication → Providers → Anonymous → Enable) — used when users tap “Continue without an account”
4. Optional: disable “Confirm email” under Authentication → Providers → Email if you want instant sign-up during development
5. Copy keys from **Project Settings → API**:
   - Project URL
   - `anon` `public` key

There are **no pricing tiers**. Users can sign in, sign up, or continue as a guest.

## 2. Environment variables

### Vercel (web app root directory = `web`)

| Name | Where | Purpose |
|------|--------|---------|
| `VITE_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel + local | Supabase anon key |
| `OPENAI_API_KEY` | Vercel (server only) | AI playlists + OpenAI TTS |
| `VITE_BIBLE_API_KEY` | optional | NIV via api.bible |

Locally, put the same values in `web/.env.local`.

## 3. Deploy front end on Vercel

1. Import the GitHub repo in Vercel
2. Set **Root Directory** to `web`
3. Add the env vars above
4. Deploy

AI/TTS stay on Vercel serverless routes (`web/api/*`). Accounts, playlists, and analytics use Supabase.
