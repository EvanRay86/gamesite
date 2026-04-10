import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import SlimeVolleyball from "@/components/SlimeVolleyball";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Slime Volleyball — Free Online Volleyball Game",
  description:
    "Jump, bump, and spike your way to victory in this classic slime volleyball game. Play free in your browser — first to 7 points wins.",
  path: "arcade/slime-volleyball",
  color: "teal",
});

export default function SlimePage() {
  return (
    <main>
      <GameJsonLd name="Slime Volleyball" description="Jump, bump, and spike your way to 7 points." path="arcade/slime-volleyball" category="arcade" />
      <SlimeVolleyball />
      <MoreArcadeGames currentSlug="slime-volleyball" />
    </main>
  );
}
