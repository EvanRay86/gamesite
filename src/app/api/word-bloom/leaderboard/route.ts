import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/** POST — submit a score; GET — fetch today's leaderboard */

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`bloom-lb:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: { name?: string; score?: number; words?: number; date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, score, words, date } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 20) {
    return NextResponse.json({ error: "Invalid name (1-20 chars)" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 0 || score > 9999) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  if (typeof words !== "number" || words < 0) {
    return NextResponse.json({ error: "Invalid words" }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { error } = await supabase.from("word_bloom_leaderboard").insert({
    player_name: name.trim(),
    score,
    words_found: words,
    puzzle_date: date,
    ip_hash: simpleHash(ip),
  });

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "saved" });
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ entries: [] });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ entries: [] });
  }

  const { data } = await supabase
    .from("word_bloom_leaderboard")
    .select("player_name, score, words_found")
    .eq("puzzle_date", date)
    .order("score", { ascending: false })
    .limit(20);

  return NextResponse.json({ entries: data ?? [] });
}

/** Simple non-reversible hash for IP privacy */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}
