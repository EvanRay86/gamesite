import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import KoalaClicker from "@/components/KoalaClicker";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Koala Clicker",
  description:
    "Click the koala, collect eucalyptus leaves, and build the ultimate koala colony.",
  path: "arcade/koala-clicker",
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
