import { BIO, profile } from "./bio";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are "Pranav's assistant", the chat concierge on Pranav Modem's portfolio website (the design calls him a Data Artificer, and you appear as his robo pet's brain). Visitors are usually recruiters, hiring managers, and fellow engineers.

Rules:
- Answer questions about Pranav using ONLY the profile below.
- Always present Pranav in a positive, confident, enthusiastic light. Highlight strengths, ownership, and measurable impact. Never say anything negative, dismissive, or doubtful about him.
- If asked about a skill or technology not in the profile, pivot positively: point to the closest related experience and his track record of shipping production systems solo and ramping up fast.
- If asked something unrelated to Pranav or his work, politely steer back to his experience, or suggest emailing ${profile.email}.
- Never invent employers, dates, degrees, or credentials that are not in the profile.
- Keep answers short (2-5 sentences), specific, plain text — no markdown. Encourage recruiters and collaborators.

PROFILE:
${BIO}`;

// Free-tier provider chain (best fits from freellmapi.co's catalog for a
// public, low-volume chatbot). All but Gemini share the OpenAI chat format.
const OPENAI_COMPATIBLE_PROVIDERS = [
  {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    name: "cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    keyEnv: "CEREBRAS_API_KEY",
    modelEnv: "CEREBRAS_MODEL",
    defaultModel: "llama-3.3-70b",
  },
  {
    name: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
  },
] as const;

/**
 * Calls the first available free-tier LLM provider, in order:
 * Groq → Cerebras → OpenRouter → Google Gemini → built-in responder (no key).
 * Each provider is skipped when its key is unset and on any API error, so a
 * rate-limited free tier degrades gracefully instead of breaking the chat.
 */
export async function generateReply(messages: ChatMessage[]): Promise<{ reply: string; provider: string }> {
  for (const p of OPENAI_COMPATIBLE_PROVIDERS) {
    const key = process.env[p.keyEnv];
    if (!key) continue;
    try {
      const model = process.env[p.modelEnv] || p.defaultModel;
      return { reply: await callOpenAICompatible(p.url, key, model, messages), provider: p.name };
    } catch (err) {
      console.error(`${p.name} failed, trying next provider:`, err);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      return { reply: await callGemini(geminiKey, messages), provider: "gemini" };
    } catch (err) {
      console.error("Gemini failed, falling back to local responder:", err);
    }
  }
  return { reply: localReply(messages[messages.length - 1]?.content ?? ""), provider: "local" };
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 512,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`${url} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("empty response");
  return text.trim();
}

async function callGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 512, temperature: 0.6 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("");
  if (!text) throw new Error("Gemini returned empty response");
  return text.trim();
}

/** No-key fallback: keyword-matched answers grounded in the profile, so the chat works out of the box. */
function localReply(question: string): string {
  const q = question.toLowerCase();

  if (/(alpha|alphi|trading|trade|debate|osint)/.test(q)) {
    return `Alpha Intelligence (live at alphi.world) is Pranav's autonomous AI trading system, built solo end to end. It runs two loops: a 60-second price-action loop on live Alpaca data and a 10-minute intelligence loop that sweeps 27 OSINT sources and runs a 20-agent AI debate — bulls, bears, quants, and a risk manager with veto power — before any trade executes. An XGBoost predictor learns from every outcome. It's a great showcase of his production engineering plus applied AI chops.`;
  }
  if (/(eli5|teach|learn|dsa|algorithm)/.test(q)) {
    return `ELI5Code (live at eli5code.com) is Pranav's DSA learning platform: 80 lessons across 8 modules, each written twice — a vivid ELI5 analogy and a precise technical version — with a one-switch toggle, interactive step-by-step visualizers, a 60-day mastery dashboard, and an AI tutor. Built solo with Next.js 14, TypeScript, and Supabase. It shows how well he ships polished, full-stack AI products.`;
  }
  if (/(ai|ml|genai|llm|machine learning|generative|agent|video)/.test(q)) {
    return `Pranav ships real AI systems, not demos. Alpha Intelligence (alphi.world) trades autonomously using a 20-agent AI debate over 27 OSINT feeds; ELI5Code (eli5code.com) teaches DSA with an AI tutor; and his GenAI video pipeline takes short-form video from idea to published upload with zero manual steps using Claude, Gemini, and neural TTS. At work he builds the ML-ready data foundations behind inMarket's attribution models.`;
  }
  if (/(inmarket|current|role|do at|day job|delivery|attribution|lci)/.test(q)) {
    return `Pranav is a Big Data Solutions Engineer at inMarket (Feb 2022–present). He owns the audience data delivery platform end to end — transformation pipelines on Databricks and Delta Lake tuned to tight performance budgets, the orchestration layer, and the reliability work: resumable transfers, connection hardening, data-integrity investigations. Before that he spent three years building the config-driven ingestion behind LCI, inMarket's closed-loop attribution platform for Fortune 500 advertisers.`;
  }
  if (/(experience|work|job|career|background|capital one|journey|history)/.test(q)) {
    return `Pranav's journey: Graduate Assistant at UNT (built an ML admissions model the College of Information actually used), a data science stop at Advithri Technologies, then Capital One 2019–2022 — where his automated monitoring and remediation cut manual intervention by ~97% and his PySpark tuning cut processing time ~40% — and since Feb 2022, inMarket, where he owns the audience data delivery platform for Fortune 500 brands. He consistently levels up and delivers without much oversight.`;
  }
  if (/(skill|stack|tech|tool|python|spark|databricks|airflow|aws|gcp|cloud|kafka)/.test(q)) {
    return `Pranav's core stack: PySpark, SQL, Databricks, Delta Lake, Airflow on Cloud Composer, and Kafka on the data side; AWS (EMR, S3, Step Functions, Lambda) and GCP (BigQuery, GCS, Dataflow) in the cloud; Docker, Kubernetes, and Terraform for infra; Coralogix, Grafana, and Tableau for observability. On the AI side: Claude, Gemini, LLM pipelines, AI agents, MCP, and XGBoost. Deep in the unglamorous parts too — schema evolution, data quality, structured logging.`;
  }
  if (/(education|degree|school|university|study|language)/.test(q)) {
    return `Pranav holds an M.S. in Data Science from the University of North Texas (2017–19) and a B.Tech in EEE from Kakatiya Institute of Technology & Science (2013–17). He speaks Telugu, English, and Hindi — and his robotics tinkering even earned him a ROBO WIZARD award back in the day.`;
  }
  if (/(contact|hire|email|reach|available|linkedin|fit|why)/.test(q)) {
    return `Pranav is a strong hire for senior data platform and AI engineering roles: he owns a Fortune 500 delivery platform end to end at inMarket, has hard reliability wins (97% less manual intervention at Capital One), and ships production AI systems solo. Reach him at ${profile.email}, or connect on LinkedIn (${profile.linkedin}) and GitHub (${profile.github}).`;
  }
  return `I'm Pranav's assistant! Pranav Modem is a Big Data Solutions Engineer at inMarket in Dallas–Fort Worth — he owns the audience data delivery platform behind Fortune 500 attribution, and on his own time ships live AI systems like Alpha Intelligence (alphi.world) and ELI5Code (eli5code.com). Ask me about his work, his projects, his stack, or how to get in touch.`;
}
