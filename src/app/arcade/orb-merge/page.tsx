import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import OrbMerge from "@/components/OrbMerge";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Play Orb Merge Online Free — Suika-Style Merge Game",
  description:
    "Play Orb Merge free — drop orbs, match colors, and merge your way to the top tier. A free physics-based merge game like Suika in your browser.",
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
