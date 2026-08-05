"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's Pranav's experience with Databricks?",
  "Tell me about his GenAI projects",
  "Why should we hire Pranav?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Pranav's AI assistant. Ask me anything about his experience, projects, or skills — I know his background inside out.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionId = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-fallback`;
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // send only the conversation (skip the canned greeting)
          messages: next.slice(1),
          sessionId: sessionId.current,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Hmm, I hit a snag reaching my brain. Please try again in a moment — or email Pranav directly at pranavmodem@gmail.com.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* launcher */}
      <button
        aria-label={open ? "Close chat" : "Chat with Pranav's AI assistant"}
        onClick={() => setOpen((o) => !o)}
        className="glow-violet fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-glow text-night-950 shadow-xl transition-transform hover:scale-105"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M21 12a8 8 0 0 1-8 8H5.6c-.9 0-1.4-1-.9-1.7l1-1.4A8 8 0 1 1 21 12Z"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="17" cy="12" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>

      {/* panel */}
      {open && (
        <div className="fade-up fixed bottom-24 right-5 z-50 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-violet-glow/25 bg-night-900 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/5 bg-night-800 px-4 py-3">
            <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-cyan-glow" />
            <div>
              <p className="text-sm font-semibold">Pranav&apos;s AI Assistant</p>
              <p className="text-xs text-ink-500">Ask about experience, projects &amp; skills</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "self-end rounded-br-sm bg-violet-glow text-night-950"
                      : "self-start rounded-bl-sm bg-night-700 text-ink-100"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <div className="self-start rounded-2xl rounded-bl-sm bg-night-700 px-3.5 py-2.5 text-sm text-ink-500">
                  <span className="pulse-dot">thinking…</span>
                </div>
              )}
              {messages.length === 1 && !busy && (
                <div className="mt-2 flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-cyan-glow/30 bg-cyan-glow/5 px-3 py-1.5 text-left text-xs text-cyan-glow transition-colors hover:bg-cyan-glow/15"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-white/5 bg-night-800 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Pranav…"
              maxLength={2000}
              className="flex-1 rounded-lg border border-white/10 bg-night-900 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-violet-glow/60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-lg bg-violet-glow px-3.5 text-sm font-semibold text-night-950 disabled:opacity-50"
              aria-label="Send"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
