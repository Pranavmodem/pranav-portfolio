import { NextRequest, NextResponse } from "next/server";
import { estimateFoodMacros } from "@/lib/ai";
import { getUserFromToken } from "@/lib/supabase";

export const maxDuration = 30;

// Signed-in only: this burns free-tier LLM quota, so it isn't public.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { item?: string; grams?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const item = (body.item ?? "").trim().slice(0, 200);
  if (!item) return NextResponse.json({ error: "Missing food description" }, { status: 400 });
  const grams = Number.isFinite(Number(body.grams)) && Number(body.grams) > 0 ? Number(body.grams) : null;

  const est = await estimateFoodMacros(item, grams);
  if (!est) {
    return NextResponse.json(
      { error: "Couldn't estimate — enter macros manually (is an AI provider key configured?)" },
      { status: 503 }
    );
  }
  return NextResponse.json(est);
}
