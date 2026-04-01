import OrbMerge from "@/components/OrbMerge";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Orb Merge — Arcade",
  description:
    "Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos.",
};

export default function OrbMergePage() {
  return (
    <main>
      <OrbMerge />
      <MoreArcadeGames currentSlug="orb-merge" />
    </main>
  );
}
