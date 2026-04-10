import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Game2048 from "@/components/Game2048";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "2048 Game — Free Online Number Puzzle",
  description:
    "Slide numbered tiles, combine matching numbers, and reach the 2048 tile. Play the classic 2048 puzzle game free online.",
  path: "arcade/2048",
  color: "amber",
});

export default function Game2048Page() {
  return (
    <main>
      <GameJsonLd name="2048" description="Slide tiles, combine numbers, and reach the 2048 tile to win." path="arcade/2048" category="arcade" />
      <Game2048 />
      <MoreArcadeGames currentSlug="2048" />
    </main>
  );
}
