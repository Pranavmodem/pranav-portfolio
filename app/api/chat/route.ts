import { NextRequest, NextResponse } from "next/server";
import { generateReply, type ChatMessage } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

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

  const { reply, provider } = await generateReply(messages);

  // Fire-and-forget logging; UUID session ids only, chat still works if logging fails.
  const sessionId = body.sessionId;
  if (sessionId && /^[0-9a-f-]{36}$/i.test(sessionId)) {
    const userMsg = messages[messages.length - 1].content;
    supabase
      .from("chat_messages")
      .insert([
        { session_id: sessionId, role: "user", content: userMsg },
        { session_id: sessionId, role: "assistant", content: reply },
      ])
      .then(({ error }) => {
        if (error) console.error("chat log insert failed:", error.message);
      });
  }

  return NextResponse.json({ reply, provider });
}
