import SnakeGame from "@/components/SnakeGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Snake Arena — Multiplayer Snake",
  description:
    "Eat, grow, and devour other players in this multiplayer snake battle.",
};

export default function SnakeArenaPage() {
  return (
    <main>
      <SnakeGame />
      <MoreArcadeGames currentSlug="snake-arena" />
    </main>
  );
}
