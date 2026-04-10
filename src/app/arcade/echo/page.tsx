import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import EchoGame from "@/components/EchoGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Play ECHO Online Free — Ghost-Run Roguelike",
  description:
    "Play ECHO free — a roguelike where death is a tool. Cooperate with your past selves to clear dungeons in as few echoes as possible.",
  path: "arcade/echo",
  color: "teal",
});

export default function EchoPage() {
  return (
    <main>
      <GameJsonLd
        name="ECHO"
        description="A roguelike where death is a tool. Cooperate with your past selves to clear dungeons."
        path="arcade/echo"
        category="arcade"
      />
      <EchoGame />
      <MoreArcadeGames currentSlug="echo" />
    </main>
  );
}
