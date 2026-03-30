import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { generateInitialMap } from "@/lib/rift-engine";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();

    // Get active season
    const { data: season } = await supabase
      .from("rift_seasons")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!season) {
      return NextResponse.json({ season: null, hexCount: 0 });
    }

    // Get hex counts per faction
    const { data: hexes } = await supabase
      .from("rift_hexes")
      .select("faction")
      .eq("season_id", season.id);

    const counts: Record<string, number> = { crimson: 0, verdant: 0, azure: 0, neutral: 0 };
    if (hexes) {
      for (const h of hexes) {
        if (h.faction) counts[h.faction]++;
        else counts.neutral++;
      }
    }

    // Get top players
    const { data: leaderboard } = await supabase
      .from("rift_players")
      .select("id, faction, elo, wins, hexes_captured")
      .eq("season_id", season.id)
      .order("elo", { ascending: false })
      .limit(10);

    return NextResponse.json({
      season,
      factionCounts: counts,
      leaderboard: leaderboard ?? [],
    });
  } catch (err) {
    console.error("Season fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if there's already an active season
    const { data: existing } = await supabase
      .from("rift_seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Season already active" }, { status: 409 });
    }

    // Get last season number
    const { data: lastSeason } = await supabase
      .from("rift_seasons")
      .select("season_number")
      .order("season_number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastSeason?.season_number ?? 0) + 1;

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + 28);

    // Create season
    const { data: season, error: seasonError } = await supabase
      .from("rift_seasons")
      .insert({
        season_number: nextNumber,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (seasonError || !season) {
      console.error("Create season error:", seasonError);
      return NextResponse.json({ error: "Failed to create season" }, { status: 500 });
    }

    // Generate initial hex map
    const hexData = generateInitialMap();
    const hexRows = hexData.map((h) => ({
      season_id: season.id,
      q: h.q,
      r: h.r,
      hex_type: h.hexType,
      faction: h.faction,
    }));

    const { error: hexError } = await supabase.from("rift_hexes").insert(hexRows);
    if (hexError) {
      console.error("Insert hexes error:", hexError);
    }

    // Log season start event
    await supabase.from("rift_events").insert({
      season_id: season.id,
      event_type: "season_start",
      data: { seasonNumber: nextNumber },
    });

    return NextResponse.json({ success: true, season });
  } catch (err) {
    console.error("Create season error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
