import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SnakeGame from "@/components/SnakeGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Snake Arena",
  description:
    "Eat, grow, and devour other players in this multiplayer snake battle.",
  path: "arcade/snake-arena",
});

export default function SnakeArenaPage() {
  return (
    <main>
      <GameJsonLd name="Snake Arena" description="Eat, grow, and devour other players in this multiplayer snake battle." path="arcade/snake-arena" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "Snake Arena" },
      ]} />
      <SnakeGame />
      <MoreArcadeGames currentSlug="snake-arena" />
    </main>
  );
}
