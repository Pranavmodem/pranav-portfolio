import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 60;

/**
 * Fires due reminders as web-push notifications. Hit this every 5–15 minutes
 * (cron-job.org free tier works great; Vercel Hobby cron is once daily).
 * Secured with CRON_SECRET: pass ?secret=... or `Authorization: Bearer ...`.
 *
 * A reminder fires when: enabled, today (in its own timezone) is in its
 * `days`, local time has passed `time_of_day`, and it hasn't fired today.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const vapidPublic =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BMqU6k7isNJ2u0YO8SZ74CI4AdlU6mkMSbMhDENAeE7GqjzGGGn3v64uLme0NoQuRTeB3Ggx3eoD6K1qzR2iaKU";
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!db || !vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY or VAPID keys in env" },
      { status: 503 }
    );
  }
  webpush.setVapidDetails("mailto:pranavmodem@gmail.com", vapidPublic, vapidPrivate);

  const { data: reminders, error } = await db
    .from("reminders")
    .select("id, user_id, title, time_of_day, days, timezone, last_fired_on")
    .eq("enabled", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let fired = 0;
  const stale: string[] = [];
  for (const r of reminders ?? []) {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: r.timezone || "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "short",
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    const localDate = `${parts.year}-${parts.month}-${parts.day}`;
    const localTime = `${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`;
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);

    if (!r.days?.includes(dow)) continue;
    if (localTime < r.time_of_day) continue;
    if (r.last_fired_on === localDate) continue;

    const { data: subs } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", r.user_id);

    const payload = JSON.stringify({ title: "⏰ " + r.title, body: "Reminder from Pranav HQ", url: "/app" });
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        fired++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.id);
        else console.error("push send failed:", err);
      }
    }
    await db.from("reminders").update({ last_fired_on: localDate }).eq("id", r.id);
  }
  if (stale.length) await db.from("push_subscriptions").delete().in("id", stale);

  return NextResponse.json({ ok: true, checked: reminders?.length ?? 0, sent: fired, pruned: stale.length });
}
