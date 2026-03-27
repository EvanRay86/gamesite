import Game2048 from "@/components/Game2048";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "2048 — Arcade",
  description:
    "Slide tiles, combine numbers, and reach the 2048 tile to win.",
};

export default function Game2048Page() {
  return (
    <main>
      <Game2048 />
      <MoreArcadeGames currentSlug="2048" />
    </main>
  );
}
