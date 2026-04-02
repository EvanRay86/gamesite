import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import GinormoSword from "@/components/GinormoSword";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Big Ah Sword",
  description:
    "Slay monsters, collect gold, and grow your sword to absurd proportions in this action RPG.",
  path: "arcade/ginormo-sword",
});

export default function GinormoSwordPage() {
  return (
    <main>
      <GameJsonLd name="Big Ah Sword" description="Slay monsters, collect gold, and grow your sword to absurd proportions in this action RPG." path="arcade/ginormo-sword" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "Big Ah Sword" },
      ]} />
      <GinormoSword />
      <MoreArcadeGames currentSlug="ginormo-sword" />
    </main>
  );
}
