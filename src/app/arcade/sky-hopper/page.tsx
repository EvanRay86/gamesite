import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SkyHopper from "@/components/SkyHopper";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Sky Hopper",
  description:
    "Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper.",
  path: "arcade/sky-hopper",
});

export default function SkyHopperPage() {
  return (
    <main>
      <GameJsonLd name="Sky Hopper" description="Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper." path="arcade/sky-hopper" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "Sky Hopper" },
      ]} />
      <SkyHopper />
      <MoreArcadeGames currentSlug="sky-hopper" />
    </main>
  );
}
