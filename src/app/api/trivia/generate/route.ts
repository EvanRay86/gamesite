import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateTriviaQuestions } from "@/lib/trivia-generate";

export async function GET(request: Request) {
  // Optional secret to protect the endpoint
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Check if puzzle already exists
  const { data: existing } = await supabase
    .from("trivia_puzzles")
    .select("id")
    .eq("puzzle_date", date)
    .single();

  if (existing) {
    return NextResponse.json({ status: "already_exists", date });
  }

  // Generate with Gemini
  const questions = await generateTriviaQuestions(date);
  if (!questions) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }

  // Store in Supabase
  const { error } = await supabase.from("trivia_puzzles").insert({
    puzzle_date: date,
    questions,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "generated", date, count: questions.length });
}
