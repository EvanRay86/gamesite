import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import LexiconQuest from "@/components/LexiconQuest";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Lexicon Quest",
  description:
    "Spell words to slay monsters in this roguelike dungeon crawler. How deep can you go?",
  path: "arcade/lexicon-quest",
});

export default function LexiconQuestPage() {
  return (
    <main>
      <GameJsonLd name="Lexicon Quest" description="Spell words to slay monsters in this roguelike dungeon crawler. How deep can you go?" path="arcade/lexicon-quest" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "Lexicon Quest" },
      ]} />
      <LexiconQuest />
      <MoreArcadeGames currentSlug="lexicon-quest" />
    </main>
  );
}
