import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import LexiconQuest from "@/components/LexiconQuest";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Play Lexicon Quest Online Free — Word Roguelike Game",
  description:
    "Play Lexicon Quest free — spell words to slay monsters in this roguelike dungeon crawler. A free word RPG you can play in your browser.",
  path: "arcade/lexicon-quest",
  color: "purple",
});

export default function LexiconQuestPage() {
  return (
    <main>
      <GameJsonLd name="Lexicon Quest" description="Spell words to slay monsters in this roguelike dungeon crawler. How deep can you go?" path="arcade/lexicon-quest" category="arcade" />
      <LexiconQuest />
      <MoreArcadeGames currentSlug="lexicon-quest" />
    </main>
  );
}
