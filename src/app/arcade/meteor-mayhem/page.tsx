import CreditGate from "@/components/CreditGate";
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
      <CreditGate creditCost={3} gameSlug="meteor-mayhem">
        <MeteorMayhem />
      </CreditGate>
      <MoreArcadeGames currentSlug="meteor-mayhem" />
    </main>
  );
}
