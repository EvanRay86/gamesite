import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import SkyHopper from "@/components/SkyHopper";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Sky Hopper",
  description:
    "Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper.",
  path: "arcade/sky-hopper",
  color: "sky",
});

export default function SkyHopperPage() {
  return (
    <main>
      <GameJsonLd name="Sky Hopper" description="Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper." path="arcade/sky-hopper" category="arcade" />
      <SkyHopper />
      <MoreArcadeGames currentSlug="sky-hopper" />
    </main>
  );
}
