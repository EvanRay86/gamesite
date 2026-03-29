import KoalaClicker from "@/components/KoalaClicker";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Koala Clicker — Arcade",
  description:
    "Click the koala, collect eucalyptus leaves, and build the ultimate koala colony.",
};

export default function KoalaClickerPage() {
  return (
    <main className="overflow-hidden max-h-[100dvh]">
      <KoalaClicker />
      <div className="hidden lg:block">
        <MoreArcadeGames currentSlug="koala-clicker" />
      </div>
    </main>
  );
}
