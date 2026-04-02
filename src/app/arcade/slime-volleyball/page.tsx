import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SlimeVolleyball from "@/components/SlimeVolleyball";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Slime Volleyball",
  description:
    "Jump, bump, and spike your way to 7 points.",
  path: "arcade/slime-volleyball",
});

export default function SlimePage() {
  return (
    <main>
      <GameJsonLd name="Slime Volleyball" description="Jump, bump, and spike your way to 7 points." path="arcade/slime-volleyball" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "Slime Volleyball" },
      ]} />
      <SlimeVolleyball />
      <MoreArcadeGames currentSlug="slime-volleyball" />
    </main>
  );
}
