import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || getTodayDate();

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(getFallbackPuzzle(date));
  }

  const { data, error } = await supabase
    .from("puzzles")
    .select("id, puzzle_date, groups")
    .eq("puzzle_date", date)
    .single();

  if (error || !data) {
    return NextResponse.json(getFallbackPuzzle(date));
  }

  return NextResponse.json(data);
}
