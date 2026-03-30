import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VALID_FACTIONS = ["crimson", "verdant", "azure"];

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`rift-join:${ip}`, { limit: 10, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { faction, seasonId } = await request.json();

    if (!faction || !VALID_FACTIONS.includes(faction)) {
      return NextResponse.json({ error: "Invalid faction" }, { status: 400 });
    }

    if (!seasonId) {
      return NextResponse.json({ error: "Missing seasonId" }, { status: 400 });
    }

    // Check if player already joined this season
    const { data: existing } = await supabase
      .from("rift_players")
      .select("id")
      .eq("user_id", user.id)
      .eq("season_id", seasonId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already joined a faction this season" }, { status: 409 });
    }

    // Create player
    const { data: player, error } = await supabase
      .from("rift_players")
      .insert({
        user_id: user.id,
        season_id: seasonId,
        faction,
        elo: 1000,
        attack_tokens: 5,
      })
      .select()
      .single();

    if (error) {
      console.error("Join faction error:", error);
      return NextResponse.json({ error: "Failed to join faction" }, { status: 500 });
    }

    return NextResponse.json({ success: true, player });
  } catch (err) {
    console.error("Join faction error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
