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

## Updating the design or content

- **UI**: re-export from Claude Design, replace `design/source.dc.html`, run
  `python3 design/build-design.py`, commit the regenerated `public/` files.
- **Assistant knowledge**: edit `lib/bio.ts` (and keep the BIO inside the design
  export in sync when you next re-export).
