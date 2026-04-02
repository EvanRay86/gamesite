import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

interface SaveBody {
  soundcloudUrl: string;
  title: string;
  artist: string;
  year: number;
  date: string;
  variant: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as SaveBody;

  const { soundcloudUrl, title, artist, year, date, variant } = body;

  if (!soundcloudUrl || !title || !artist || !year || !date || !variant) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid fields. Need soundcloudUrl, title, artist, year, date, variant.",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured (missing service role key)" },
        { status: 500 },
      );
    }

    // Check if the requested date already has a puzzle for this variant
    const { data: existing } = await supabase
      .from("heardle_puzzles")
      .select("puzzle_date")
      .eq("puzzle_date", date)
      .eq("variant", variant)
      .maybeSingle();

    let assignedDate = date;

    if (existing) {
      // Find the earliest available date starting from the requested date
      // Fetch all occupied dates for this variant from the requested date onward
      const { data: occupied } = await supabase
        .from("heardle_puzzles")
        .select("puzzle_date")
        .eq("variant", variant)
        .gte("puzzle_date", date)
        .order("puzzle_date", { ascending: true });

      const occupiedSet = new Set(
        (occupied || []).map((r: { puzzle_date: string }) => r.puzzle_date),
      );

      // Walk forward from the requested date until we find a gap
      let candidate = date;
      while (occupiedSet.has(candidate)) {
        const next = new Date(candidate + "T00:00:00");
        next.setDate(next.getDate() + 1);
        candidate = next.toISOString().slice(0, 10);
      }
      assignedDate = candidate;
    }

    const { error } = await supabase.from("heardle_puzzles").insert({
      puzzle_date: assignedDate,
      variant,
      title,
      artist,
      year,
      soundcloud_url: soundcloudUrl,
    });

    if (error) {
      console.error("Supabase save failed:", error);
      return NextResponse.json(
        { error: "Database save failed" },
        { status: 500 },
      );
    }

    const dateNote =
      assignedDate !== date
        ? ` (${date} was taken, assigned to ${assignedDate})`
        : "";

    return NextResponse.json({
      success: true,
      message: `Saved "${title}" by ${artist} (${year}) for ${assignedDate} [${variant}]${dateNote}`,
    });
  } catch (err) {
    console.error("Save failed:", err);
    return NextResponse.json(
      { error: "Failed to save puzzle" },
      { status: 500 },
    );
  }
}
