import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Game2048 from "@/components/Game2048";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Play 2048 Online Free — Classic Number Puzzle Game",
  description:
    "Play 2048 free — slide tiles, combine numbers, and reach the 2048 tile. The classic puzzle game, playable instantly in your browser.",
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
