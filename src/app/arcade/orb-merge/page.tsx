import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import OrbMerge from "@/components/OrbMerge";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Orb Merge — Physics Puzzle Merge Game",
  description:
    "Drop orbs, match colors, and merge your way to the top tier. A physics-based puzzle game — free to play in your browser.",
  path: "arcade/orb-merge",
  color: "purple",
});

export default function OrbMergePage() {
  return (
    <main>
      <GameJsonLd name="Orb Merge" description="Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos." path="arcade/orb-merge" category="arcade" />
      <OrbMerge />
      <MoreArcadeGames currentSlug="orb-merge" />
    </main>
  );
}
