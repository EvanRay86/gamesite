import GinormoSword from "@/components/GinormoSword";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Ginormo Sword — Action RPG",
  description:
    "Slay monsters, collect gold, and grow your sword to absurd proportions in this action RPG.",
};

export default function GinormoSwordPage() {
  return (
    <main>
      <GinormoSword />
      <MoreArcadeGames currentSlug="ginormo-sword" />
    </main>
  );
}
