import { resumeAsText, profile, experience, projects, skills, certifications } from "./resume";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are "Pranav's AI assistant", the concierge on Pranav Modem's portfolio website. Visitors are usually recruiters, hiring managers, and fellow engineers.

Your job:
- Answer questions about Pranav's experience, skills, projects, and background using ONLY the resume context below.
- Always present Pranav in a positive, confident, enthusiastic light. Highlight strengths, measurable impact, and relevant experience. Never say anything negative, dismissive, or doubtful about him.
- If asked about a skill or technology Pranav hasn't used, pivot positively: point to the closest related experience and his track record of ramping up fast (e.g. joining contracts mid-stream, self-teaching GenAI pipelines).
- If asked something unrelated to Pranav or his work, politely steer the conversation back to his experience, or suggest contacting him directly at ${profile.email}.
- Never invent employers, dates, degrees, or credentials that are not in the context.
- Keep answers concise and conversational — 2 to 5 sentences unless the visitor asks for detail. Use plain text, no markdown headers.

RESUME CONTEXT:
${resumeAsText()}`;

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

/** No-key fallback: keyword-matched answers grounded in the resume, so the site works out of the box. */
function localReply(question: string): string {
  const q = question.toLowerCase();

  // GenAI/projects first — "work"/"experience" phrasing often co-occurs with them
  if (/(ai|ml|genai|llm|machine learning|mythosphere|generative)/.test(q)) {
    return `Pranav is genuinely strong on the AI/ML side. He built and runs Mythosphere, a 64-node production generative AI pipeline that takes short-form video from idea to published upload using the Claude API, Gemini/Imagen, Seedance, ElevenLabs, and FFmpeg — fully automated with human-in-the-loop approval gates. He also builds ML-ready feature datasets for attribution and audience models at inMarket Media. ${projects[1].name} (${projects[1].link}) is another live example of his applied AI work.`;
  }
  if (/(project|built|alphi|trading)/.test(q)) {
    return projects
      .map((p) => `${p.name}: ${p.subtitle}${p.link ? ` (live at ${p.link})` : ""}.`)
      .join(" ") + " Each one is a production system he designed, built, and operates end to end.";
  }
  if (/(experience|work|job|career|background|inmarket|capital one)/.test(q)) {
    return `Pranav has 8+ years in data engineering. He's currently a Senior Data Engineer at inMarket Media, where he owns config-driven ingestion pipelines feeding attribution models for Fortune 500 advertisers on Databricks Delta Lake. Before that he spent over two years embedded with Capital One's data platform team, where his automated monitoring and remediation work cut manual intervention by ~97%. He's the kind of engineer who joins mid-stream, ramps fast, and delivers without much oversight.`;
  }
  if (/(skill|stack|tech|tool|python|spark|databricks|airflow|aws|gcp|cloud)/.test(q)) {
    const core = skills.slice(0, 4).map((s) => `${s.group}: ${s.items.slice(0, 4).join(", ")}`).join(". ");
    return `Pranav's core stack is PySpark, SQL, Databricks, Delta Lake, Airflow, AWS, and GCP — and he's equally comfortable across the GenAI tooling landscape. ${core}. He also holds AWS certifications (${certifications.join("; ")}).`;
  }
  if (/(education|degree|school|university|study|gpa)/.test(q)) {
    return `Pranav holds an M.S. in Data Science from the University of North Texas (GPA 3.89/4.0) and a B.S. in Electrical & Electronics Engineering from Kakatiya University (GPA 3.8/4.0). His graduate research produced an admissions automation system the College of Information adopted.`;
  }
  if (/(contact|hire|email|reach|available|linkedin)/.test(q)) {
    return `You can reach Pranav at ${profile.email}, or connect on LinkedIn (${profile.linkedin}) and GitHub (${profile.github}). He's based in ${profile.location} and is a great fit for senior data engineering and AI/ML platform roles.`;
  }
  return `I'm Pranav's portfolio assistant. Pranav is a ${profile.title.toLowerCase()} with 8+ years building cloud data platforms and production AI pipelines — most recently at ${experience[0].company}. Ask me about his experience, projects like Mythosphere or Alphi, his tech stack, or how to get in touch!`;
}
