import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { pickPuzzleType, generateDuelPuzzle } from "@/lib/rift-puzzles";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`rift-attack:${ip}`, { limit: 30, windowSeconds: 60 });
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

    const { seasonId, hexQ, hexR } = await request.json();

    if (seasonId === undefined || hexQ === undefined || hexR === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify player exists and has tokens
    const { data: player } = await supabase
      .from("rift_players")
      .select("*")
      .eq("user_id", user.id)
      .eq("season_id", seasonId)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Refresh tokens if needed
    const { data: tokens } = await supabase.rpc("rift_refresh_tokens", {
      p_player_id: player.id,
      p_max_tokens: 5,
    });

    // Use attack token
    const { data: remaining } = await supabase.rpc("rift_use_attack_token", {
      p_player_id: player.id,
    });

    if (remaining === -1) {
      return NextResponse.json({ error: "No attack tokens remaining" }, { status: 403 });
    }

    // Get hex
    const { data: hex } = await supabase
      .from("rift_hexes")
      .select("*")
      .eq("season_id", seasonId)
      .eq("q", hexQ)
      .eq("r", hexR)
      .single();

    if (!hex) {
      return NextResponse.json({ error: "Hex not found" }, { status: 404 });
    }

    // Generate puzzle
    const seed = Date.now();
    const puzzleType = pickPuzzleType(seed);
    const puzzleData = generateDuelPuzzle(puzzleType, seed);

    // Create duel record
    const { data: duel, error } = await supabase
      .from("rift_duels")
      .insert({
        season_id: seasonId,
        hex_id: hex.id,
        attacker_id: player.id,
        puzzle_type: puzzleType,
        puzzle_data: puzzleData,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Create duel error:", error);
      return NextResponse.json({ error: "Failed to create duel" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      duel,
      puzzleData,
      remainingTokens: remaining,
    });
  } catch (err) {
    console.error("Attack error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
