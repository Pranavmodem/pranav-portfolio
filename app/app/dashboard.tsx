"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Entry = { id: string; kind: string; note: string | null; value: number | null; logged_at: string };
type Reminder = {
  id: string;
  title: string;
  time_of_day: string;
  days: number[];
  timezone: string;
  enabled: boolean;
};
type Msg = { role: "user" | "assistant"; content: string };

const KINDS = [
  { id: "diet", label: "🍽 Diet" },
  { id: "gym", label: "🏋️ Gym" },
  { id: "water", label: "💧 Water" },
  { id: "sleep", label: "😴 Sleep" },
  { id: "other", label: "✍️ Other" },
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TZ = "America/Chicago";

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return <Shell><p className="text-ink-500">Loading…</p></Shell>;
  }
  return session ? <Home session={session} /> : <Login />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-grid min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

/* ── Login ─────────────────────────────────────────────────────────── */

function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setStage("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setErr(error.message);
  }

  return (
    <Shell>
      <div className="flex flex-1 items-center justify-center">
        <div className="card w-full max-w-sm p-8">
          <div className="mb-6 text-center">
            <div className="text-4xl">🤖</div>
            <h1 className="mt-2 text-2xl font-bold">Pranav HQ</h1>
            <p className="mt-1 text-sm text-ink-500">Private dashboard — sign in with your email</p>
          </div>
          {stage === "email" ? (
            <form onSubmit={sendCode} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-lg border border-white/10 bg-night-900 px-4 py-2.5 text-sm outline-none focus:border-violet-glow/60"
              />
              <button disabled={busy} className="btn-primary">{busy ? "Sending…" : "Email me a code"}</button>
            </form>
          ) : (
            <form onSubmit={verify} className="flex flex-col gap-3">
              <p className="text-sm text-ink-300">
                Check {email} — click the sign-in link, or enter the code if your email includes one.
              </p>
              <input
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="rounded-lg border border-white/10 bg-night-900 px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-violet-glow/60"
              />
              <button disabled={busy} className="btn-primary">{busy ? "Checking…" : "Sign in"}</button>
              <button type="button" onClick={() => setStage("email")} className="text-xs text-ink-500 hover:text-ink-300">
                ← different email
              </button>
            </form>
          )}
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        </div>
      </div>
    </Shell>
  );
}

/* ── Dashboard home ────────────────────────────────────────────────── */

function Home({ session }: { session: Session }) {
  const [tab, setTab] = useState<"track" | "chat" | "remind">("track");
  return (
    <Shell>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            <span className="text-gradient">Pranav HQ</span>
          </h1>
          <p className="text-xs text-ink-500">{session.user.email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-xs text-ink-500 hover:text-ink-300">
          Sign out
        </button>
      </header>

      <nav className="mb-6 grid grid-cols-3 gap-2">
        {(
          [
            ["track", "📒 Track"],
            ["chat", "🤖 Assistant"],
            ["remind", "⏰ Reminders"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "border-violet-glow/60 bg-violet-glow/15 text-ink-100"
                : "border-white/10 text-ink-500 hover:text-ink-300"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "track" && <Tracker />}
      {tab === "chat" && <Assistant session={session} />}
      {tab === "remind" && <Reminders session={session} />}
    </Shell>
  );
}

/* ── Tracker ───────────────────────────────────────────────────────── */

function Tracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [kind, setKind] = useState("diet");
  const [note, setNote] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 14 * 86400_000).toISOString();
    const { data } = await supabase
      .from("entries")
      .select("*")
      .gte("logged_at", since)
      .order("logged_at", { ascending: false });
    setEntries((data as Entry[]) ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.from("entries").insert({
      kind,
      note: note.trim() || null,
      value: value.trim() ? Number(value) : null,
    });
    setBusy(false);
    if (!error) {
      setNote("");
      setValue("");
      load();
    }
  }

  async function remove(id: string) {
    await supabase.from("entries").delete().eq("id", id);
    setEntries((es) => es.filter((e) => e.id !== id));
  }

  const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: TZ });
  const today = dayKey(new Date().toISOString());
  const gymStreak = (() => {
    const gymDays = new Set(entries.filter((e) => e.kind === "gym").map((e) => dayKey(e.logged_at)));
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = dayKey(new Date(Date.now() - i * 86400_000).toISOString());
      if (gymDays.has(d)) streak++;
      else if (i > 0) break; // today not logged yet doesn't break the streak
    }
    return streak;
  })();
  const todayCount = entries.filter((e) => dayKey(e.logged_at) === today).length;

  const grouped: [string, Entry[]][] = [];
  for (const e of entries) {
    const k = dayKey(e.logged_at);
    const g = grouped.find(([d]) => d === k);
    if (g) g[1].push(e);
    else grouped.push([k, [e]]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="font-mono text-2xl font-bold text-gradient">{gymStreak}</div>
          <div className="text-xs text-ink-500">day gym streak</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-mono text-2xl font-bold text-gradient">{todayCount}</div>
          <div className="text-xs text-ink-500">logs today</div>
        </div>
      </div>

      <form onSubmit={add} className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                kind === k.id
                  ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow"
                  : "border-white/10 text-ink-500 hover:text-ink-300"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={kind === "diet" ? "Chicken bowl, ~650 cal…" : kind === "gym" ? "Push day: bench 3×8…" : "Note…"}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-night-900 px-3 py-2 text-sm outline-none focus:border-violet-glow/60"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="#"
            title="Optional number (calories, oz, hours…)"
            className="w-16 rounded-lg border border-white/10 bg-night-900 px-2 py-2 text-center text-sm outline-none focus:border-violet-glow/60"
          />
          <button disabled={busy} className="btn-primary px-4">Log</button>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {grouped.map(([day, list]) => (
          <div key={day}>
            <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-cyan-glow">
              {day === today ? "Today" : day}
            </h3>
            <div className="flex flex-col gap-1.5">
              {list.map((e) => (
                <div key={e.id} className="card flex items-center gap-3 p-3">
                  <span className="text-lg">{KINDS.find((k) => k.id === e.kind)?.label.split(" ")[0] ?? "✍️"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {e.note || e.kind}
                      {e.value != null && <span className="text-cyan-glow"> · {e.value}</span>}
                    </p>
                    <p className="text-xs text-ink-500">
                      {new Date(e.logged_at).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <button onClick={() => remove(e.id)} className="text-ink-500 hover:text-red-400" aria-label="Delete">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-center text-sm text-ink-500">Nothing logged yet — start above 💪</p>}
      </div>
    </div>
  );
}

/* ── Personal assistant ────────────────────────────────────────────── */

function Assistant({ session }: { session: Session }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey Pranav! I can see your tracker, so ask me anything — diet ideas, workout plans, or literally any other question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "failed");
      setMsgs((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Hit a snag — try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex h-[60vh] min-h-[380px] flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "self-end rounded-br-sm bg-violet-glow text-night-950"
                  : "self-start rounded-bl-sm bg-night-700 text-ink-100"
              }`}
            >
              {m.content}
            </div>
          ))}
          {busy && <div className="self-start rounded-2xl bg-night-700 px-3.5 py-2.5 text-sm text-ink-500">thinking…</div>}
        </div>
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/5 bg-night-800 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about diet, workouts, anything…"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-night-900 px-3 py-2 text-sm outline-none focus:border-violet-glow/60"
        />
        <button disabled={busy || !input.trim()} className="btn-primary px-4" aria-label="Send">➤</button>
      </form>
    </div>
  );
}

/* ── Reminders ─────────────────────────────────────────────────────── */

function Reminders({ session }: { session: Session }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [notifState, setNotifState] = useState<"unknown" | "on" | "off" | "unsupported">("unknown");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("reminders").select("*").order("time_of_day");
    setReminders((data as Reminder[]) ?? []);
  }, []);
  useEffect(() => {
    load();
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifState("unsupported");
    } else {
      setNotifState(Notification.permission === "granted" ? "on" : "off");
    }
  }, [load]);

  async function enableNotifications() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setMsg("Notifications blocked — allow them in browser settings."); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const vapid =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BMqU6k7isNJ2u0YO8SZ74CI4AdlU6mkMSbMhDENAeE7GqjzGGGn3v64uLme0NoQuRTeB3Ggx3eoD6K1qzR2iaKU";
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setNotifState("on");
      setMsg("✓ This device will get reminder notifications.");
    } catch (e) {
      console.error(e);
      setMsg("Could not enable notifications on this device.");
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || days.length === 0) return;
    const { error } = await supabase.from("reminders").insert({
      title: title.trim(),
      time_of_day: time,
      days,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || TZ,
    });
    if (!error) {
      setTitle("");
      load();
    }
  }

  async function toggle(r: Reminder) {
    await supabase.from("reminders").update({ enabled: !r.enabled }).eq("id", r.id);
    load();
  }
  async function remove(id: string) {
    await supabase.from("reminders").delete().eq("id", id);
    setReminders((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-4">
        {notifState === "on" ? (
          <p className="text-sm text-cyan-glow">✓ Notifications enabled on this device</p>
        ) : notifState === "unsupported" ? (
          <p className="text-sm text-ink-500">
            This browser doesn&apos;t support push. On iPhone: add this site to your Home Screen first, then enable here.
          </p>
        ) : (
          <button onClick={enableNotifications} className="btn-primary w-full">
            🔔 Enable notifications on this device
          </button>
        )}
        {msg && <p className="mt-2 text-xs text-ink-500">{msg}</p>}
      </div>

      <form onSubmit={add} className="card flex flex-col gap-3 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Drink water · Hit the gym · Log dinner…"
          className="rounded-lg border border-white/10 bg-night-900 px-3 py-2 text-sm outline-none focus:border-violet-glow/60"
        />
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-white/10 bg-night-900 px-3 py-2 text-sm outline-none focus:border-violet-glow/60"
          />
          <div className="flex flex-1 flex-wrap gap-1">
            {DAY_NAMES.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  days.includes(i) ? "bg-violet-glow/25 text-ink-100" : "text-ink-500 hover:text-ink-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <button className="btn-primary px-4">Add</button>
        </div>
      </form>

      <div className="flex flex-col gap-1.5">
        {reminders.map((r) => (
          <div key={r.id} className={`card flex items-center gap-3 p-3 ${r.enabled ? "" : "opacity-50"}`}>
            <button onClick={() => toggle(r)} className="text-lg" aria-label="Toggle">
              {r.enabled ? "🔔" : "🔕"}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{r.title}</p>
              <p className="font-mono text-xs text-ink-500">
                {r.time_of_day} · {r.days.length === 7 ? "every day" : r.days.map((d) => DAY_NAMES[d]).join(" ")}
              </p>
            </div>
            <button onClick={() => remove(r.id)} className="text-ink-500 hover:text-red-400" aria-label="Delete">
              ✕
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <p className="text-center text-sm text-ink-500">No reminders yet — add one above ⏰</p>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
