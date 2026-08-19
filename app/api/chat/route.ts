import { NextRequest, NextResponse } from "next/server";
import { generateReply, generatePersonalReply, type ChatMessage } from "@/lib/ai";
import { supabase, createUserClient, getUserFromToken } from "@/lib/supabase";

export const maxDuration = 30;

const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ ...m, content: m.content.slice(0, MAX_CHARS) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  // Personal mode: a valid Supabase session token switches the bot from the
  // public portfolio persona to Pranav's own assistant (any topic, with
  // recent tracker entries as context for diet/gym questions).
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const user = await getUserFromToken(token);

  if (user && token) {
    const db = createUserClient(token);
    const [{ data: entries }, { data: foods }, { data: prefRow }] = await Promise.all([
      db.from("entries").select("kind, note, value, logged_at").order("logged_at", { ascending: false }).limit(40),
      db
        .from("food_log")
        .select("eaten_on, meal, item, grams, kcal, protein_g, carbs_g, fat_g")
        .order("created_at", { ascending: false })
        .limit(40),
      db.from("user_prefs").select("content").eq("user_id", user.id).maybeSingle(),
    ]);
    const { reply, provider } = await generatePersonalReply(messages, {
      entries: entries ?? [],
      foods: foods ?? [],
      prefs: prefRow?.content ?? "",
    });
    return NextResponse.json({ reply, provider, mode: "personal" });
  }

  const { reply, provider } = await generateReply(messages);

  // Awaited (not fire-and-forget: serverless freezes after the response, which
  // can drop background inserts). Chat still works if logging fails.
  const sessionId = body.sessionId;
  if (sessionId && /^[0-9a-f-]{36}$/i.test(sessionId)) {
    const userMsg = messages[messages.length - 1].content;
    const { error } = await supabase.from("chat_messages").insert([
      { session_id: sessionId, role: "user", content: userMsg },
      { session_id: sessionId, role: "assistant", content: reply },
    ]);
    if (error) console.error("chat log insert failed:", error.message);
  }

  return NextResponse.json({ reply, provider, mode: "public" });
}
