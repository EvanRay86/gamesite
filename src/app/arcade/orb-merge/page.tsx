import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import OrbMerge from "@/components/OrbMerge";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Orb Merge",
  description:
    "Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos.",
  path: "arcade/orb-merge",
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
