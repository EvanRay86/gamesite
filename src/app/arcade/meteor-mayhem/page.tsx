import FreePlaysGate from "@/components/FreePlaysGate";
import MeteorMayhem from "@/components/MeteorMayhem";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Meteor Mayhem — Arcade",
  description:
    "Blast meteors, grab power-ups, and chase your high score in this fast-paced space shooter.",
};

export default function MeteorMayhemPage() {
  return (
    <main>
      <FreePlaysGate creditCost={3} gameSlug="meteor-mayhem">
        {(onGameStart) => <MeteorMayhem onGameStart={onGameStart} />}
      </FreePlaysGate>
      <MoreArcadeGames currentSlug="meteor-mayhem" />
    </main>
  );
}
