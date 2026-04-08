import GlobleGame from "@/components/GlobleGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Play Globle Online Free — Daily Country Guessing Game",
  description:
    "Guess the mystery country on the globe! Each guess is color-coded by proximity — the hotter the color, the closer you are. A free daily geography puzzle.",
  path: "daily/globle",
  color: "green",
});

export default function GloblePage() {
  return (
    <main>
      <GameJsonLd
        name="Globle"
        description="Guess the mystery country — each guess is color-coded by proximity on an interactive globe. A new country every day."
        path="daily/globle"
        category="daily"
      />
      <GlobleGame />
      <MoreDailyGames currentSlug="globle" />
    </main>
  );
}
