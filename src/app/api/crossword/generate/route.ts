import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateCrosswordEntries } from "@/lib/crossword-generate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  // Check if puzzle already exists for this date
  const { data: existing } = await supabase
    .from("crossword_puzzles")
    .select("id")
    .eq("puzzle_date", date)
    .single();

  if (existing) {
    return NextResponse.json({ status: "already_exists", date });
  }

  // Generate with Gemini + Google Search (AP News)
  const entries = await generateCrosswordEntries(date);
  if (!entries) {
    return NextResponse.json(
      { error: "Crossword generation failed" },
      { status: 500 }
    );
  }

  // Store in Supabase
  const { error } = await supabase.from("crossword_puzzles").insert({
    puzzle_date: date,
    title: "News Crossword",
    subtitle: `Today in the headlines — ${new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    entries,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: "generated",
    date,
    count: entries.length,
  });
}
