import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import Game2048 from "@/components/Game2048";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "2048",
  description:
    "Slide tiles, combine numbers, and reach the 2048 tile to win.",
  path: "arcade/2048",
});

export default function Game2048Page() {
  return (
    <main>
      <GameJsonLd name="2048" description="Slide tiles, combine numbers, and reach the 2048 tile to win." path="arcade/2048" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "2048" },
      ]} />
      <Game2048 />
      <MoreArcadeGames currentSlug="2048" />
    </main>
  );
}
