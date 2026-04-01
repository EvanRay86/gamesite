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

    const { error } = await supabase.from("framed_puzzles").upsert(
      {
        puzzle_date: date,
        variant,
        tmdb_id: body.tmdbId || null,
        title,
        year,
        frames: framePaths,
        movie_slug: movieSlug,
      },
      { onConflict: "puzzle_date,variant" },
    );

    if (error) {
      console.error("Supabase save failed:", error);
      return NextResponse.json({ error: "Database save failed" }, { status: 500 });
    }

    // 3. Clean up temp session
    await cleanupSession(sessionId);

    return NextResponse.json({
      success: true,
      framePaths,
      message: `Saved ${title} (${year}) for ${date} [${variant}]`,
    });
  } catch (err) {
    console.error("Save failed:", err);
    return NextResponse.json(
      { error: "Failed to save puzzle" },
      { status: 500 },
    );
  }
}
