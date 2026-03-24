import { NextRequest, NextResponse } from "next/server";
import { saveAudioClip, cleanupSession } from "@/lib/heardle-audio";
import { getSupabase } from "@/lib/supabase";

interface SaveBody {
  sessionId: string;
  title: string;
  artist: string;
  year: number;
  date: string;
  variant: string;
  songSlug: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SaveBody;

  const { sessionId, title, artist, year, date, variant, songSlug } = body;

  if (!sessionId || !title || !artist || !year || !date || !variant || !songSlug) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid fields. Need sessionId, title, artist, year, date, variant, songSlug.",
      },
      { status: 400 },
    );
  }

  try {
    // 1. Copy trimmed clip to public/heardle/{songSlug}/
    const audioPath = await saveAudioClip(sessionId, songSlug);

    // 2. Save puzzle metadata to Supabase
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("heardle_puzzles").upsert(
        {
          puzzle_date: date,
          variant,
          title,
          artist,
          year,
          audio_url: audioPath,
          song_slug: songSlug,
        },
        { onConflict: "puzzle_date,variant" },
      );

      if (error) {
        console.warn(
          "Supabase save failed (puzzle still saved locally):",
          error,
        );
      }
    }

    // 3. Clean up temp session
    await cleanupSession(sessionId);

    return NextResponse.json({
      success: true,
      audioPath,
      message: `Saved "${title}" by ${artist} (${year}) for ${date} [${variant}]`,
    });
  } catch (err) {
    console.error("Save failed:", err);
    return NextResponse.json(
      { error: "Failed to save puzzle" },
      { status: 500 },
    );
  }
}
