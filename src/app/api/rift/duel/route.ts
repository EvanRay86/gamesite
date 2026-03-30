import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { calculateEloChange, clampElo } from "@/lib/rift-elo";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`rift-duel:${ip}`, { limit: 30, windowSeconds: 60 });
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

    const { duelId, score } = await request.json();

    if (!duelId || score === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Get duel
    const { data: duel } = await supabase
      .from("rift_duels")
      .select("*")
      .eq("id", duelId)
      .single();

    if (!duel || duel.status !== "active") {
      return NextResponse.json({ error: "Duel not found or already completed" }, { status: 404 });
    }

    // Get attacker player
    const { data: attacker } = await supabase
      .from("rift_players")
      .select("*")
      .eq("id", duel.attacker_id)
      .single();

    if (!attacker) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // AI defender score
    const aiScore = Math.round(300 + Math.random() * 400);
    const won = score > aiScore;

    // Calculate ELO
    const aiElo = 900;
    const [eloChange] = calculateEloChange(attacker.elo, aiElo, won);
    const newElo = clampElo(attacker.elo + eloChange);

    // Update duel
    await supabase
      .from("rift_duels")
      .update({
        attacker_score: score,
        defender_score: aiScore,
        winner_id: won ? attacker.id : null,
        attacker_elo_change: eloChange,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", duelId);

    // Update player stats
    await supabase
      .from("rift_players")
      .update({
        elo: newElo,
        wins: attacker.wins + (won ? 1 : 0),
        losses: attacker.losses + (won ? 0 : 1),
        hexes_captured: attacker.hexes_captured + (won ? 1 : 0),
      })
      .eq("id", attacker.id);

    // If won, update hex ownership
    if (won) {
      await supabase
        .from("rift_hexes")
        .update({
          faction: attacker.faction,
          captured_at: new Date().toISOString(),
          captured_by: attacker.id,
        })
        .eq("id", duel.hex_id);

      // Log event
      const { data: hex } = await supabase
        .from("rift_hexes")
        .select("q, r")
        .eq("id", duel.hex_id)
        .single();

      if (hex) {
        await supabase.from("rift_events").insert({
          season_id: duel.season_id,
          event_type: "capture",
          data: {
            playerName: "Player",
            faction: attacker.faction,
            hex: { q: hex.q, r: hex.r },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      won,
      myScore: score,
      opponentScore: aiScore,
      eloChange,
      newElo,
    });
  } catch (err) {
    console.error("Duel submit error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
