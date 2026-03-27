import SlimeVolleyball from "@/components/SlimeVolleyball";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Slime Volleyball — Online Multiplayer",
  description: "Play Slime Volleyball against friends or random opponents online.",
};

export default function SlimePage() {
  return (
    <main>
      <SlimeVolleyball />
      <MoreArcadeGames currentSlug="slime-volleyball" />
    </main>
  );
}
