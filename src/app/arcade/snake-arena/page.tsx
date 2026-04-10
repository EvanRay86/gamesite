import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import SnakeGame from "@/components/SnakeGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Snake Arena — Multiplayer Snake Game Online",
  description:
    "Eat, grow, and devour other players in this multiplayer snake battle. Free online snake game — play instantly in your browser.",
  path: "arcade/snake-arena",
  color: "green",
});

export default function SnakeArenaPage() {
  return (
    <main>
      <GameJsonLd name="Snake Arena" description="Eat, grow, and devour other players in this multiplayer snake battle." path="arcade/snake-arena" category="arcade" />
      <SnakeGame />
      <MoreArcadeGames currentSlug="snake-arena" />
    </main>
  );
}
