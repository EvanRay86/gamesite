import OrbMerge from "@/components/OrbMerge";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Orb Merge — Arcade",
  description:
    "Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos.",
  openGraph: {
    title: "Orb Merge",
    description:
      "Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos.",
    url: "https://gamesite.app/arcade/orb-merge",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Orb Merge",
    description:
      "Drop orbs, match colors, and merge your way to the top tier. Physics-based chaos.",
  },
};

export default function OrbMergePage() {
  return (
    <main>
      <OrbMerge />
      <MoreArcadeGames currentSlug="orb-merge" />
    </main>
  );
}
