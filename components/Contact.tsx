"use client";

import { useState } from "react";
import { profile } from "@/lib/resume";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="py-16">
      <h2 className="mb-2 font-mono text-sm uppercase tracking-widest text-cyan-glow">04 / Contact</h2>
      <h3 className="mb-4 text-3xl font-bold">Let&apos;s build something</h3>
      <p className="mb-8 max-w-xl text-ink-300">
        Recruiting for a senior data or AI platform role? Drop a note here or email{" "}
        <a href={`mailto:${profile.email}`} className="text-violet-glow hover:underline">
          {profile.email}
        </a>
        .
      </p>
      <form onSubmit={handleSubmit} className="card flex max-w-xl flex-col gap-4 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="name"
            required
            maxLength={200}
            placeholder="Your name"
            className="rounded-lg border border-white/10 bg-night-900 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-violet-glow/60"
          />
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder="Your email"
            className="rounded-lg border border-white/10 bg-night-900 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-violet-glow/60"
          />
        </div>
        <textarea
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="Tell me about the role or project…"
          className="resize-y rounded-lg border border-white/10 bg-night-900 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-violet-glow/60"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="glow-violet self-start rounded-lg bg-violet-glow px-6 py-2.5 text-sm font-semibold text-night-950 transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "sent" && (
          <p className="text-sm text-cyan-glow">Thanks! Your message is in — Pranav will get back to you soon.</p>
        )}
        {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}
      </form>
    </section>
  );
}
