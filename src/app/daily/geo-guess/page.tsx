import GeoGuessGame from "@/components/GeoGuessGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getGeoPuzzle } from "@/lib/geo-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "GeoGuess",
  description:
    "Guess the country from progressive hints: flag, capital, population, and fun facts. 4 guesses, 1 country per day.",
  path: "daily/geo-guess",
});

export default function GeoGuessPage() {
  const today = new Date().toISOString().slice(0, 10);
  const puzzle = getGeoPuzzle(today);

  return (
    <main>
      <GameJsonLd name="GeoGuess" description="Guess the country from progressive hints: flag, capital, population, and fun facts. 4 guesses, 1 country per day." path="daily/geo-guess" category="daily" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Daily", href: "/daily" },
        { label: "GeoGuess" },
      ]} />
      <GeoGuessGame puzzle={puzzle} />
      <MoreDailyGames currentSlug="geo-guess" />
    </main>
  );
}
