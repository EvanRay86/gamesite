import TriviaGame from "@/components/TriviaGame";
import {
  getTriviaPuzzleByDate,
  getTodayDate,
  generateAndStorePuzzle,
  getFallbackTriviaPuzzle,
} from "@/lib/trivia-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Daily Trivia — Gamesite",
  description: "Test your knowledge with 8 daily trivia questions featuring current events.",
};

export default async function TriviaPage() {
  const today = getTodayDate();

  // 1. Try Supabase
  let puzzle = await getTriviaPuzzleByDate(today);

  // 2. If not found, generate with Gemini + store
  if (!puzzle) {
    puzzle = await generateAndStorePuzzle(today);
  }

  // 3. Last resort: seed data
  if (!puzzle) {
    puzzle = getFallbackTriviaPuzzle(today);
  }

  return (
    <main>
      <TriviaGame puzzle={puzzle} />
    </main>
  );
}
