import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import SlimeVolleyball from "@/components/SlimeVolleyball";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Play Slime Volleyball Online Free — Classic Browser Game",
  description:
    "Play Slime Volleyball free — jump, bump, and spike your way to victory. The classic slime volleyball game, playable instantly in your browser.",
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
