# Pranav Modem — Portfolio v2

Personal portfolio with an AI assistant that answers questions about Pranav's
experience, grounded in his resume. Built with **Next.js 15**, **Tailwind CSS 4**,
**Supabase**, and deployed on **Vercel** — all free tiers.

## Features

- 🌙 Dark "nocturne" single-page portfolio: hero, experience timeline, AI/ML projects, skills, contact
- 🤖 Floating AI chat widget — resume-grounded, recruiter-friendly answers
  - Free-tier provider chain: **Groq** → **Cerebras** → **OpenRouter** → **Google Gemini** → built-in offline responder (no key needed)
  - Providers picked from the [freellmapi](https://github.com/tashfeenahmed/freellmapi) free-LLM catalog; each falls through on rate limits/errors
- 🗄️ **Supabase** (free tier) stores chat transcripts and contact-form messages
  - Row Level Security: anonymous visitors can only *insert*, never read
- ⚡ Zero paid dependencies

## Local development

```bash
npm install
cp .env.example .env.local   # optionally add GROQ_API_KEY / GEMINI_API_KEY
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repo (framework auto-detects Next.js).
3. Add environment variables (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (values in `.env.example`)
   - `GROQ_API_KEY` — free key from [console.groq.com/keys](https://console.groq.com/keys)
   - *(optional fallbacks)* `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`
4. Deploy, then add the custom domain **pranavmodem.com** (Project → Settings → Domains) and point your DNS at Vercel.

Without any AI key the chatbot still works using built-in resume-grounded answers.

## Supabase schema

Project: `portfolio-v2` (`anifxfvhgymuzvessuuw`, us-east-2). Migration
`portfolio_chat_and_contact` creates:

| table | purpose | RLS |
|---|---|---|
| `chat_messages` | chat transcripts (`session_id`, `role`, `content`) | anon insert-only |
| `contact_messages` | contact form submissions | anon insert-only |

Read submissions in the [Supabase dashboard](https://supabase.com/dashboard/project/anifxfvhgymuzvessuuw) → Table Editor.

## Editing content

All resume/profile content lives in **`lib/resume.ts`** — one file drives both
the page sections and the AI assistant's knowledge. The assistant's persona
(always positive, redirects off-topic questions) is in **`lib/ai.ts`**.
