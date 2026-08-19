"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { summarizeHae, type HealthSnapshot } from "@/lib/health";

type Food = {
  id: number;
  eaten_on: string;
  meal: string | null;
  item: string;
  grams: number | null;
  kcal: number | null;
  protein_g: number | null;
};
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

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TZ = "America/Chicago";
const CHAT_KEY = "pranav_hq_chat_v1";

const todayChicago = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date()
  );

/* ── Root ──────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<"today" | "chat" | "remind">("today");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-28 pt-6 sm:px-6">
        <header className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-[#8e8e93]">{dateLabel}</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">Summary</h1>
          </div>
          <AccountBadge session={session} authReady={authReady} />
        </header>

        {tab === "today" && <TodayView session={session} />}
        {tab === "chat" && <AssistantView session={session} />}
        {tab === "remind" && <RemindersView session={session} />}
      </main>

      {/* iOS-style bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#121216]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {(
            [
              ["today", "❤️‍🔥", "Today"],
              ["chat", "🤖", "Assistant"],
              ["remind", "⏰", "Reminders"],
            ] as const
          ).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                tab === id ? "text-[#ff375f]" : "text-[#8e8e93]"
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function AccountBadge({ session, authReady }: { session: Session | null; authReady: boolean }) {
  const [open, setOpen] = useState(false);
  if (!authReady) return <div className="h-9 w-9 rounded-full bg-white/10" />;
  if (!session) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-[#ff375f] px-4 py-1.5 text-sm font-semibold text-white"
        >
          Sign in
        </button>
        {open && <LoginSheet onClose={() => setOpen(false)} />}
      </>
    );
  }
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      title={`${session.user.email} — tap to sign out`}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff375f] to-[#bf5af2] text-sm font-bold text-white"
    >
      {(session.user.email ?? "P")[0].toUpperCase()}
    </button>
  );
}

/* ── Login (bottom sheet) ──────────────────────────────────────────── */

function LoginSheet({ onClose }: { onClose: () => void }) {
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
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-[#1c1c1e] p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-white">Sign in to Pranav HQ</h2>
          <p className="mt-1 text-sm text-[#8e8e93]">Unlocks habits, reminders, health data & assistant memory</p>
        </div>
        {stage === "email" ? (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="ios-input"
            />
            <button disabled={busy} className="ios-btn">{busy ? "Sending…" : "Email me a code"}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="flex flex-col gap-3">
            <p className="text-sm text-[#c7c7cc]">
              Check {email} — enter the 6-digit code (or tap the emailed link on this device).
            </p>
            <input
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="ios-input text-center font-mono text-lg tracking-[0.4em]"
            />
            <button disabled={busy} className="ios-btn">{busy ? "Checking…" : "Sign in"}</button>
          </form>
        )}
        {err && <p className="mt-3 text-sm text-[#ff453a]">{err}</p>}
        <button onClick={onClose} className="mt-4 w-full text-center text-sm text-[#8e8e93]">Cancel</button>
      </div>
    </div>
  );
}

/* ── Today ─────────────────────────────────────────────────────────── */

function TodayView({ session }: { session: Session | null }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [gymStreak, setGymStreak] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const loadFoods = useCallback(async () => {
    const since = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("food_log")
      .select("*")
      .gte("eaten_on", since)
      .order("created_at", { ascending: false });
    if (error) setErr(`Couldn't load food log: ${error.message}`);
    else setFoods((data as Food[]) ?? []);
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  useEffect(() => {
    if (!session) {
      setHealth(null);
      setGymStreak(null);
      return;
    }
    supabase
      .from("hae_raw")
      .select("data")
      .order("received_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data?.length) setHealth(summarizeHae(data));
      });
    supabase
      .from("entries")
      .select("kind, logged_at")
      .eq("kind", "gym")
      .gte("logged_at", new Date(Date.now() - 30 * 86400_000).toISOString())
      .then(({ data }) => {
        if (!data) return;
        const days = new Set(data.map((e) => new Date(e.logged_at).toLocaleDateString("en-US", { timeZone: TZ })));
        let streak = 0;
        for (let i = 0; i < 30; i++) {
          const d = new Date(Date.now() - i * 86400_000).toLocaleDateString("en-US", { timeZone: TZ });
          if (days.has(d)) streak++;
          else if (i > 0) break;
        }
        setGymStreak(streak);
      });
  }, [session]);

  const today = todayChicago();
  const todayFoods = foods.filter((f) => f.eaten_on === today);
  const kcalToday = todayFoods.reduce((s, f) => s + (f.kcal ?? 0), 0);
  const proteinToday = Math.round(todayFoods.reduce((s, f) => s + (Number(f.protein_g) || 0), 0) * 10) / 10;

  // last-7-day kcal bars
  const week: { day: string; kcal: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    week.push({
      day: d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "narrow" }),
      kcal: foods.filter((f) => f.eaten_on === key).reduce((s, f) => s + (f.kcal ?? 0), 0),
    });
  }
  const maxKcal = Math.max(500, ...week.map((w) => w.kcal));

  return (
    <div className="flex flex-col gap-4">
      {err && <ErrorBanner msg={err} onClose={() => setErr("")} />}

      {/* metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard color="#ff375f" icon="🔥" label="Calories" value={kcalToday || "0"} unit="kcal today" />
        <MetricCard color="#ff9f0a" icon="🥩" label="Protein" value={proteinToday || "0"} unit="g today" />
        <MetricCard
          color="#30d158"
          icon="👟"
          label="Steps"
          value={session ? health?.steps ?? "…" : "—"}
          unit={session ? health?.stepsDate ?? "latest" : "sign in"}
        />
        <MetricCard
          color="#bf5af2"
          icon="⚖️"
          label="Weight"
          value={session ? health?.weightKg ?? "…" : "—"}
          unit={session ? "kg" : "sign in"}
        />
        <MetricCard
          color="#64d2ff"
          icon="😴"
          label="Sleep"
          value={session ? health?.sleepHours ?? "…" : "—"}
          unit={session ? "hrs" : "sign in"}
        />
        <MetricCard
          color="#ffd60a"
          icon="🏋️"
          label="Gym streak"
          value={session ? gymStreak ?? "…" : "—"}
          unit={session ? "days" : "sign in"}
        />
      </div>

      {/* weekly kcal bars */}
      <div className="ios-card">
        <p className="mb-3 text-sm font-semibold text-[#8e8e93]">CALORIES · LAST 7 DAYS</p>
        <div className="flex h-24 items-end justify-between gap-2">
          {week.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-md bg-[#ff375f]"
                style={{ height: `${Math.max(4, (w.kcal / maxKcal) * 80)}px`, opacity: w.kcal ? 1 : 0.18 }}
              />
              <span className="text-[10px] text-[#8e8e93]">{w.day}</span>
            </div>
          ))}
        </div>
      </div>

      <FoodLogger onAdded={loadFoods} />

      <FoodList foods={todayFoods} canDelete={!!session} onChanged={loadFoods} />

      <HabitCard session={session} onLogged={() => setGymStreak(null)} />
    </div>
  );
}

function MetricCard({
  color,
  icon,
  label,
  value,
  unit,
}: {
  color: string;
  icon: string;
  label: string;
  value: number | string;
  unit: string;
}) {
  return (
    <div className="ios-card">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
        <span>{icon}</span> {label}
      </div>
      <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
      <div className="text-xs text-[#8e8e93]">{unit}</div>
    </div>
  );
}

function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#ff453a]/15 px-4 py-3 text-sm text-[#ff6961]">
      <span>{msg}</span>
      <button onClick={onClose} aria-label="Dismiss">✕</button>
    </div>
  );
}

/* ── Food logging ──────────────────────────────────────────────────── */

function FoodLogger({ onAdded }: { onAdded: () => void }) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date()));
  const defaultMeal = hour < 11 ? "breakfast" : hour < 15 ? "lunch" : hour < 21 ? "dinner" : "snack";
  const [meal, setMeal] = useState<string>(defaultMeal);
  const [item, setItem] = useState("");
  const [grams, setGrams] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!item.trim() || busy) return;
    setBusy(true);
    setErr("");
    const { error } = await supabase.from("food_log").insert({
      meal,
      item: item.trim(),
      grams: grams.trim() ? Number(grams) : null,
      kcal: kcal.trim() ? Math.round(Number(kcal)) : null,
      protein_g: protein.trim() ? Number(protein) : null,
    });
    setBusy(false);
    if (error) {
      setErr(`Couldn't save: ${error.message}`);
      return;
    }
    setItem(""); setGrams(""); setKcal(""); setProtein("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onAdded();
  }

  return (
    <form onSubmit={add} className="ios-card flex flex-col gap-3">
      <p className="text-sm font-semibold text-[#8e8e93]">LOG FOOD</p>
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-black/40 p-1">
        {MEALS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMeal(m)}
            className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
              meal === m ? "bg-[#3a3a3c] text-white" : "text-[#8e8e93]"
            }`}
          >
            {MEAL_ICONS[m]} {m}
          </button>
        ))}
      </div>
      <input
        value={item}
        onChange={(e) => setItem(e.target.value)}
        placeholder="Chicken thigh curry + basmati…"
        className="ios-input"
      />
      <div className="grid grid-cols-3 gap-2">
        <input value={grams} onChange={(e) => setGrams(e.target.value)} inputMode="decimal" placeholder="grams" className="ios-input" />
        <input value={kcal} onChange={(e) => setKcal(e.target.value)} inputMode="numeric" placeholder="kcal" className="ios-input" />
        <input value={protein} onChange={(e) => setProtein(e.target.value)} inputMode="decimal" placeholder="protein g" className="ios-input" />
      </div>
      <button disabled={busy || !item.trim()} className="ios-btn">
        {busy ? "Saving…" : saved ? "Added ✓" : "Add to log"}
      </button>
      {err && <p className="text-sm text-[#ff453a]">{err}</p>}
    </form>
  );
}

function FoodList({ foods, canDelete, onChanged }: { foods: Food[]; canDelete: boolean; onChanged: () => void }) {
  const [err, setErr] = useState("");
  async function remove(id: number) {
    const { error } = await supabase.from("food_log").delete().eq("id", id);
    if (error) setErr(`Couldn't delete: ${error.message}`);
    else onChanged();
  }
  if (foods.length === 0)
    return <p className="px-1 text-center text-sm text-[#8e8e93]">Nothing eaten today — log your first meal above 🍽</p>;

  const byMeal = MEALS.map((m) => ({ meal: m, list: foods.filter((f) => (f.meal ?? "snack") === m) })).filter(
    (g) => g.list.length
  );

  return (
    <div className="flex flex-col gap-3">
      {err && <ErrorBanner msg={err} onClose={() => setErr("")} />}
      {byMeal.map((g) => (
        <div key={g.meal} className="ios-card">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-semibold capitalize text-white">
              {MEAL_ICONS[g.meal]} {g.meal}
            </p>
            <span className="text-xs text-[#8e8e93]">{g.list.reduce((s, f) => s + (f.kcal ?? 0), 0)} kcal</span>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {g.list.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{f.item}</p>
                  <p className="text-xs text-[#8e8e93]">
                    {[f.grams != null ? `${f.grams}g` : null, f.kcal != null ? `${f.kcal} kcal` : null, f.protein_g != null ? `${f.protein_g}g protein` : null]
                      .filter(Boolean)
                      .join(" · ") || "no details"}
                  </p>
                </div>
                {canDelete && (
                  <button onClick={() => remove(f.id)} className="text-[#8e8e93] hover:text-[#ff453a]" aria-label="Delete">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Habits ────────────────────────────────────────────────────────── */

function HabitCard({ session, onLogged }: { session: Session | null; onLogged: () => void }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function log(kind: string, note: string) {
    setErr("");
    setMsg("");
    const { error } = await supabase.from("entries").insert({ kind, note });
    if (error) setErr(`Couldn't save: ${error.message}${error.message.includes("row-level") ? " — are you signed in?" : ""}`);
    else {
      setMsg(`${note} logged ✓`);
      setTimeout(() => setMsg(""), 2500);
      onLogged();
    }
  }

  if (!session)
    return (
      <div className="ios-card text-sm text-[#8e8e93]">
        🏋️ Sign in (top right) to track gym sessions, water, and sleep — and to give the assistant memory.
      </div>
    );

  return (
    <div className="ios-card">
      <p className="mb-3 text-sm font-semibold text-[#8e8e93]">QUICK HABITS</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => log("gym", "Gym session")} className="ios-chip">🏋️ Gym done</button>
        <button onClick={() => log("water", "Water")} className="ios-chip">💧 Water</button>
        <button onClick={() => log("sleep", "Good sleep")} className="ios-chip">😴 Slept well</button>
      </div>
      {msg && <p className="mt-2 text-sm text-[#30d158]">{msg}</p>}
      {err && <p className="mt-2 text-sm text-[#ff453a]">{err}</p>}
    </div>
  );
}

/* ── Assistant ─────────────────────────────────────────────────────── */

function AssistantView({ session }: { session: Session | null }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_KEY);
      if (stored) {
        setMsgs(JSON.parse(stored));
        return;
      }
    } catch {}
    setMsgs([
      {
        role: "assistant",
        content: "Hey Pranav! I can see your food log, habits, and saved preferences — ask me anything.",
      },
    ]);
  }, []);

  useEffect(() => {
    if (msgs.length) {
      try {
        localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-60)));
      } catch {}
    }
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
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        // send the last 20 turns, skipping any leading greeting
        body: JSON.stringify({ messages: next.filter((m, i) => !(i === 0 && m.role === "assistant")).slice(-20) }),
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

  function clearChat() {
    localStorage.removeItem(CHAT_KEY);
    setMsgs([{ role: "assistant", content: "Fresh start! What's on your mind?" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {!session && (
        <div className="rounded-xl bg-[#ff9f0a]/15 px-4 py-3 text-sm text-[#ffd60a]">
          You&apos;re not signed in — the assistant is in public portfolio mode. Sign in (top right) for your
          personal assistant with food-log context and saved preferences.
        </div>
      )}
      {session && <PrefsEditor session={session} />}
      <div className="ios-card flex h-[56vh] min-h-[360px] flex-col overflow-hidden !p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "self-end rounded-br-sm bg-[#ff375f] text-white"
                    : "self-start rounded-bl-sm bg-[#2c2c2e] text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && <div className="self-start rounded-2xl bg-[#2c2c2e] px-3.5 py-2.5 text-sm text-[#8e8e93]">thinking…</div>}
          </div>
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-white/10 bg-black/30 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Diet, workouts, anything…"
            className="ios-input min-w-0 flex-1"
          />
          <button disabled={busy || !input.trim()} className="ios-btn !w-auto px-4" aria-label="Send">➤</button>
        </form>
      </div>
      <button onClick={clearChat} className="text-center text-xs text-[#8e8e93]">Clear conversation</button>
    </div>
  );
}

function PrefsEditor({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    supabase
      .from("user_prefs")
      .select("content")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setContent(data?.content ?? "");
        setLoaded(true);
      });
  }, [session.user.id]);

  async function save() {
    setState("saving");
    const { error } = await supabase
      .from("user_prefs")
      .upsert({ user_id: session.user.id, content, updated_at: new Date().toISOString() });
    setState(error ? "error" : "saved");
    if (!error) setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="ios-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-semibold text-white">
        <span>🧠 Assistant memory & preferences</span>
        <span className="text-[#8e8e93]">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-[#8e8e93]">
            Saved here permanently and included in every answer — goals, diet rules, injuries, schedule, anything.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!loaded}
            rows={5}
            placeholder={"e.g.\n- Goal: 90kg by December, high-protein diet\n- Vegetarian on Tuesdays\n- Push/pull/legs split, gym at 6pm\n- Remind me to hit 8,000 steps"}
            className="ios-input resize-y !text-[13px] leading-relaxed"
          />
          <button onClick={save} disabled={state === "saving" || !loaded} className="ios-btn">
            {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Failed — retry" : "Save memory"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Reminders ─────────────────────────────────────────────────────── */

function RemindersView({ session }: { session: Session | null }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [notifState, setNotifState] = useState<"unknown" | "on" | "off" | "unsupported">("unknown");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("reminders").select("*").order("time_of_day");
    setReminders((data as Reminder[]) ?? []);
  }, []);

  useEffect(() => {
    if (session) load();
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifState("unsupported");
    } else {
      setNotifState(Notification.permission === "granted" ? "on" : "off");
    }
  }, [session, load]);

  if (!session)
    return (
      <div className="ios-card text-sm text-[#8e8e93]">
        ⏰ Sign in (top right) to create reminders with push notifications on your devices.
      </div>
    );

  async function enableNotifications() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setMsg("Notifications blocked — allow them in settings."); return; }
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
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
    setErr("");
    const { error } = await supabase.from("reminders").insert({
      title: title.trim(),
      time_of_day: time,
      days,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || TZ,
    });
    if (error) setErr(`Couldn't save: ${error.message}`);
    else {
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
    <div className="flex flex-col gap-3">
      <div className="ios-card">
        {notifState === "on" ? (
          <p className="text-sm text-[#30d158]">✓ Notifications enabled on this device</p>
        ) : notifState === "unsupported" ? (
          <p className="text-sm text-[#8e8e93]">
            This browser doesn&apos;t support push. On iPhone: add this site to your Home Screen, open it from there,
            then enable here.
          </p>
        ) : (
          <button onClick={enableNotifications} className="ios-btn">🔔 Enable notifications on this device</button>
        )}
        {msg && <p className="mt-2 text-xs text-[#8e8e93]">{msg}</p>}
      </div>

      <form onSubmit={add} className="ios-card flex flex-col gap-3">
        <p className="text-sm font-semibold text-[#8e8e93]">NEW REMINDER</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hit the gym · Log dinner · 8,000 steps…"
          className="ios-input"
        />
        <div className="flex items-center gap-2">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="ios-input !w-auto" />
          <div className="flex flex-1 flex-wrap gap-1">
            {DAY_NAMES.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays((ds) => (ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i]))}
                className={`rounded-md px-2 py-1 text-xs ${
                  days.includes(i) ? "bg-[#ff375f]/25 text-white" : "text-[#8e8e93]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <button className="ios-btn">Add reminder</button>
        {err && <p className="text-sm text-[#ff453a]">{err}</p>}
      </form>

      <div className="flex flex-col gap-2">
        {reminders.map((r) => (
          <div key={r.id} className={`ios-card flex items-center gap-3 ${r.enabled ? "" : "opacity-50"}`}>
            <button onClick={() => toggle(r)} className="text-xl" aria-label="Toggle">{r.enabled ? "🔔" : "🔕"}</button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{r.title}</p>
              <p className="font-mono text-xs text-[#8e8e93]">
                {r.time_of_day} · {r.days.length === 7 ? "every day" : r.days.map((d) => DAY_NAMES[d]).join(" ")}
              </p>
            </div>
            <button onClick={() => remove(r.id)} className="text-[#8e8e93] hover:text-[#ff453a]" aria-label="Delete">✕</button>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-center text-sm text-[#8e8e93]">No reminders yet ⏰</p>}
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
