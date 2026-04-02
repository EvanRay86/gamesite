import { NextRequest, NextResponse } from "next/server";
import {
  saveSelectedFrames,
  cleanupSession,
} from "@/lib/trailer-frames";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

interface SaveBody {
  sessionId: string;
  selectedFrames: string[]; // 6 filenames from the session
  title: string;
  year: number;
  date: string; // ISO date
  variant: string;
  movieSlug: string;
  tmdbId?: number;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as SaveBody;

  const { sessionId, selectedFrames, title, year, date, variant, movieSlug } =
    body;

  if (
    !sessionId ||
    !selectedFrames ||
    selectedFrames.length !== 6 ||
    !title ||
    !year ||
    !date ||
    !variant ||
    !movieSlug
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields. Need sessionId, 6 selectedFrames, title, year, date, variant, movieSlug." },
      { status: 400 },
    );
  }

  try {
    // 1. Copy selected frames to public/framed/{movieSlug}/
    const framePaths = await saveSelectedFrames(
      sessionId,
      selectedFrames,
      movieSlug,
    );

    // 2. Save puzzle metadata to Supabase
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Check if a puzzle already exists for this date+variant
    let assignedDate = date;
    const { data: existing } = await supabase
      .from("framed_puzzles")
      .select("puzzle_date")
      .eq("puzzle_date", date)
      .eq("variant", variant)
      .single();

    if (existing) {
      // Find the next available date starting from the day after the requested date
      const { data: occupied } = await supabase
        .from("framed_puzzles")
        .select("puzzle_date")
        .eq("variant", variant)
        .gte("puzzle_date", date)
        .order("puzzle_date", { ascending: true });

      const occupiedSet = new Set((occupied || []).map((r: { puzzle_date: string }) => r.puzzle_date));
      const candidate = new Date(date + "T00:00:00");
      candidate.setDate(candidate.getDate() + 1); // start from next day
      while (occupiedSet.has(candidate.toISOString().slice(0, 10))) {
        candidate.setDate(candidate.getDate() + 1);
      }
      assignedDate = candidate.toISOString().slice(0, 10);
    }

    const { error } = await supabase.from("framed_puzzles").insert({
      puzzle_date: assignedDate,
      variant,
      tmdb_id: body.tmdbId || null,
      title,
      year,
      frames: framePaths,
      movie_slug: movieSlug,
    });

    if (error) {
      console.error("Supabase save failed:", error);
      return NextResponse.json({ error: "Database save failed" }, { status: 500 });
    }

    // 3. Clean up temp session
    await cleanupSession(sessionId);

    const dateChanged = assignedDate !== date;
    return NextResponse.json({
      success: true,
      framePaths,
      assignedDate,
      dateChanged,
      message: dateChanged
        ? `Date ${date} was taken — saved ${title} (${year}) for next available date ${assignedDate} [${variant}]`
        : `Saved ${title} (${year}) for ${assignedDate} [${variant}]`,
    });
  } catch (err) {
    console.error("Save failed:", err);
    return NextResponse.json(
      { error: "Failed to save puzzle" },
      { status: 500 },
    );
  }
}
