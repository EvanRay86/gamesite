import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`koala-save:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: { player_id?: string; save_data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { player_id, save_data } = body;

  if (!player_id || typeof player_id !== "string" || player_id.length > 64) {
    return NextResponse.json({ error: "Invalid player_id" }, { status: 400 });
  }

  if (!save_data || typeof save_data !== "object") {
    return NextResponse.json({ error: "Invalid save_data" }, { status: 400 });
  }

  const { error } = await supabase.from("koala_saves").upsert(
    {
      player_id,
      save_data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "player_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "saved" });
}
