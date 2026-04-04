import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import KoalaClicker from "@/components/KoalaClicker";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Play Koala Clicker Online Free — Idle Clicker Game",
  description:
    "Play Koala Clicker free — click the koala, collect eucalyptus leaves, and build the ultimate koala colony. A free idle clicker game in your browser.",
  path: "arcade/koala-clicker",
  color: "green",
});

export default function KoalaClickerPage() {
  return (
    <main className="overflow-hidden max-h-[100dvh]">
      <GameJsonLd name="Koala Clicker" description="Click the koala, collect eucalyptus leaves, and build the ultimate koala colony." path="arcade/koala-clicker" category="arcade" />
      <KoalaClicker />
      <div className="hidden lg:block">
        <MoreArcadeGames currentSlug="koala-clicker" />
      </div>
    </main>
  );
}
