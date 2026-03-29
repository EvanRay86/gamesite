import SkyHopper from "@/components/SkyHopper";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Sky Hopper — Arcade",
  description:
    "Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper.",
};

export default function SkyHopperPage() {
  return (
    <main>
      <SkyHopper />
      <MoreArcadeGames currentSlug="sky-hopper" />
    </main>
  );
}
