# Pranav Modem — Portfolio v2 · pranavmodem.com

RPG-themed portfolio ("Data Artificer, Lv. 7") built in Claude Design, served
by **Next.js 15** with an AI assistant, **Supabase** logging, and free-tier
LLM providers. Deployed on **Vercel**.

## How it's put together

- **The page** is the Claude Design export, served statically:
  - `design/source.dc.html` — the original self-contained export (source of truth for the UI)
  - `design/build-design.py` — unpacks it into `public/index.html` + `public/ds/*`
    (fonts, photo, Phosphor icons, React, the design runtime), rewrites asset refs,
    injects SEO tags, and adds a shim that routes the design's built-in chat
    (`window.claude.complete`) to this site's `/api/chat`
  - `next.config.ts` rewrites `/` → `/index.html`
- **The assistant** (`app/api/chat/route.ts` + `lib/ai.ts`):
  - Free-tier provider chain: **Groq** → **Cerebras** → **OpenRouter** → **Gemini**,
    each falling through on errors/rate limits, with a built-in profile-grounded
    responder when no key is set — the chat always works
  - Persona: always positive about Pranav, grounded in `lib/bio.ts` (mirrors the
    BIO embedded in the design), redirects off-topic questions
- **Supabase** (project `portfolio-v2`, `anifxfvhgymuzvessuuw`, us-east-2):
  - `chat_messages` (session transcripts) and `contact_messages`
  - RLS: anonymous visitors can insert, never read
  - Review rows in the [dashboard](https://supabase.com/dashboard/project/anifxfvhgymuzvessuuw) → Table Editor

## Local development

```bash
npm install
cp .env.example .env.local   # optionally add GROQ_API_KEY etc.
npm run dev                  # http://localhost:3000
```

## Deploy to Vercel

1. Import this repo at [vercel.com/new](https://vercel.com/new) (Next.js auto-detected).
2. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (values in `.env.example`)
   - `GROQ_API_KEY` — free key from [console.groq.com/keys](https://console.groq.com/keys)
   - optional fallbacks: `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`
3. Deploy, then add the domain **pranavmodem.com** (Settings → Domains) and point DNS at Vercel.

## Pranav HQ — private tracker at `/app`

Mobile-first PWA (installable from the browser menu / iOS "Add to Home Screen";
`start_url` opens `/app`). Sign in with your email (Supabase Auth OTP/magic link).

- **Track**: log diet, gym, water, sleep, or anything (note + optional number);
  gym streak and daily counts; 14-day history. RLS keeps rows per-user.
- **Assistant**: when signed in, the bot switches to personal mode — any topic,
  including diet/nutrition and workout advice, with your recent log as context.
- **Reminders**: title + time + days; delivered as web-push notifications to
  every device where you tapped "Enable notifications".

### One-time setup for reminders & auth

1. Vercel env vars (in addition to the ones above):
   - `VAPID_PRIVATE_KEY` — pairs with the public key in `.env.example`
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API
   - `CRON_SECRET` — any random string
2. Schedule the reminder check every 5–15 min (Vercel Hobby cron is only daily,
   kept in `vercel.json` as a backstop): create a free job at
   [cron-job.org](https://cron-job.org) hitting
   `https://pranavmodem.com/api/cron/reminders?secret=<CRON_SECRET>`.
3. Supabase dashboard → Auth → URL Configuration: set Site URL to
   `https://pranavmodem.com` and add `https://pranavmodem.com/app` to Redirect
   URLs (so magic links land on the dashboard). Optional: add `{{ .Token }}`
   to the Magic Link email template to also get a 6-digit code.
4. iPhone: open the site in Safari → Share → **Add to Home Screen**, launch it
   from there, then tap "Enable notifications" in the Reminders tab (iOS only
   allows web push for installed PWAs).

## Updating the design or content

- **UI**: re-export from Claude Design, replace `design/source.dc.html`, run
  `python3 design/build-design.py`, commit the regenerated `public/` files.
- **Assistant knowledge**: edit `lib/bio.ts` (and keep the BIO inside the design
  export in sync when you next re-export).
