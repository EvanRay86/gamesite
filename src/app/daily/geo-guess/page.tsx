import GeoGuessGame from "@/components/GeoGuessGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import { getGeoPuzzle } from "@/lib/geo-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "GeoGuess — Gamesite",
  description:
    "Guess the country from progressive hints: flag, capital, population, and fun facts. 4 guesses, 1 country per day.",
};

export default function GeoGuessPage() {
  const today = new Date().toISOString().slice(0, 10);
  const puzzle = getGeoPuzzle(today);

  return (
    <main>
      <GeoGuessGame puzzle={puzzle} />
      <MoreDailyGames currentSlug="geo-guess" />
    </main>
  );
}
