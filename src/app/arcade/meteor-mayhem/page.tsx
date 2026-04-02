import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import FreePlaysGate from "@/components/FreePlaysGate";
import MeteorMayhem from "@/components/MeteorMayhem";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Meteor Mayhem",
  description:
    "Blast meteors, grab power-ups, and chase your high score in this neon space shooter.",
  path: "arcade/meteor-mayhem",
});

export default function MeteorMayhemPage() {
  return (
    <main>
      <GameJsonLd name="Meteor Mayhem" description="Blast meteors, grab power-ups, and chase your high score in this neon space shooter." path="arcade/meteor-mayhem" category="arcade" />
      <FreePlaysGate creditCost={3} gameSlug="meteor-mayhem">
        <MeteorMayhem />
      </FreePlaysGate>
      <MoreArcadeGames currentSlug="meteor-mayhem" />
    </main>
  );
}
