import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import WarpGame from "@/components/WarpGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "WARP — Gravitational Slingshot Puzzle Game",
  description:
    "Aim, launch, and slingshot through gravitational fields in this orbital puzzle game. 30 levels of n-body physics. Free browser game.",
  path: "arcade/warp",
  color: "purple",
});

export default function WarpPage() {
  return (
    <main>
      <GameJsonLd
        name="WARP"
        description="Aim, launch, and slingshot through gravitational fields in this orbital puzzle game."
        path="arcade/warp"
        category="arcade"
      />
      <WarpGame />
      <MoreArcadeGames currentSlug="warp" />
    </main>
  );
}
