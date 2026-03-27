import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";

/** GET /api/admin/puzzles — fetch ALL puzzles (bypasses RLS) for the admin panel */
export async function GET() {
  const supabase = getSupabaseAdmin() ?? getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Fetch all trivia puzzles
  const { data: trivia, error: triviaErr } = await supabase
    .from("trivia_puzzles")
    .select("id, puzzle_date, questions, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch all crossword puzzles
  const { data: crosswords, error: crosswordErr } = await supabase
    .from("crossword_puzzles")
    .select("id, puzzle_date, title, entries, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch all cluster puzzles
  const { data: clusters, error: clustersErr } = await supabase
    .from("puzzles")
    .select("id, puzzle_date, groups, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch framed puzzles (table may not exist yet — fail gracefully)
  const { data: framed } = await supabase
    .from("framed_puzzles")
    .select("id, puzzle_date, title, year, variant, movie_slug, frames, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch heardle puzzles (table may not exist yet — fail gracefully)
  const { data: heardle } = await supabase
    .from("heardle_puzzles")
    .select("id, puzzle_date, title, artist, year, variant, soundcloud_url, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch anagram puzzles (table may not exist yet — fail gracefully)
  const { data: anagram } = await supabase
    .from("anagram_puzzles")
    .select("id, puzzle_date, words, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch word ladder puzzles (table may not exist yet — fail gracefully)
  const { data: wordLadder } = await supabase
    .from("word_ladder_puzzles")
    .select("id, puzzle_date, start_word, end_word, solution, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch emoji word puzzles (table may not exist yet — fail gracefully)
  const { data: emojiWord } = await supabase
    .from("emoji_word_puzzles")
    .select("id, puzzle_date, rounds, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch top 5 puzzles (table may not exist yet — fail gracefully)
  const { data: top5 } = await supabase
    .from("top5_puzzles")
    .select("id, puzzle_date, category, items, unit, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch quotable puzzles (table may not exist yet — fail gracefully)
  const { data: quotable } = await supabase
    .from("quotable_puzzles")
    .select("id, puzzle_date, quote, attribution, hint, options, created_at")
    .order("puzzle_date", { ascending: true });

  // Fetch timeline puzzles (table may not exist yet — fail gracefully)
  const { data: timeline } = await supabase
    .from("timeline_puzzles")
    .select("id, puzzle_date, events, created_at")
    .order("puzzle_date", { ascending: true });

  if (triviaErr || crosswordErr || clustersErr) {
    return NextResponse.json(
      { error: "Failed to fetch puzzles", details: { triviaErr, crosswordErr, clustersErr } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    trivia: trivia ?? [],
    crosswords: crosswords ?? [],
    clusters: clusters ?? [],
    framed: framed ?? [],
    heardle: heardle ?? [],
    anagram: anagram ?? [],
    wordLadder: wordLadder ?? [],
    emojiWord: emojiWord ?? [],
    top5: top5 ?? [],
    quotable: quotable ?? [],
    timeline: timeline ?? [],
    fetchedAt: new Date().toISOString(),
  });
}
