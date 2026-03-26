import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabase } from "@/lib/supabase";

const TABLE_MAP: Record<string, string> = {
  trivia: "trivia_puzzles",
  crossword: "crossword_puzzles",
  connections: "puzzles",
  framed: "framed_puzzles",
  heardle: "heardle_puzzles",
  anagram: "anagram_puzzles",
  "word-ladder": "word_ladder_puzzles",
  "emoji-word": "emoji_word_puzzles",
};

function getTable(type: string): string | null {
  return TABLE_MAP[type] ?? null;
}

/** POST /api/admin/puzzles/[type] — insert a new puzzle */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const table = getTable(type);
  if (!table) {
    return NextResponse.json({ error: "Invalid puzzle type" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin() ?? getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = await req.json();
  if (!body || !body.puzzle_date) {
    return NextResponse.json({ error: "Missing puzzle data" }, { status: 400 });
  }

  const { error } = await supabase.from(table).insert(body);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** PATCH /api/admin/puzzles/[type] — update a puzzle's date */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const table = getTable(type);
  if (!table) {
    return NextResponse.json({ error: "Invalid puzzle type" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin() ?? getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id, puzzle_date } = await req.json();
  if (!id || !puzzle_date) {
    return NextResponse.json({ error: "Missing id or puzzle_date" }, { status: 400 });
  }

  const { error } = await supabase
    .from(table)
    .update({ puzzle_date })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE /api/admin/puzzles/[type] — delete a puzzle by ID */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const table = getTable(type);
  if (!table) {
    return NextResponse.json({ error: "Invalid puzzle type" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin() ?? getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
