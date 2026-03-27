import KoalaClicker from "@/components/KoalaClicker";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Koala Clicker — Arcade",
  description:
    "Click the koala, collect eucalyptus leaves, and build the ultimate koala colony.",
};

export default function KoalaClickerPage() {
  return (
    <main>
      <KoalaClicker />
      <MoreArcadeGames currentSlug="koala-clicker" />
    </main>
  );
}
