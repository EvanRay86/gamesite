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

    const { error } = await supabase.from("heardle_puzzles").upsert(
      {
        puzzle_date: date,
        variant,
        title,
        artist,
        year,
        soundcloud_url: soundcloudUrl,
      },
      { onConflict: "puzzle_date,variant" },
    );

    if (error) {
      console.error("Supabase save failed:", error);
      return NextResponse.json(
        { error: "Database save failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
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
