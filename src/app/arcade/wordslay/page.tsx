import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import MoreArcadeGames from "@/components/MoreArcadeGames";
import LexiconQuestEmbed from "@/components/LexiconQuestEmbed";

export const metadata = buildGameMetadata({
  title: "Play Wordslay Online Free — Word Roguelike Game",
  description:
    "Play Wordslay free — spell words to slay monsters in this roguelike dungeon crawler. A free word RPG you can play in your browser.",
  path: "arcade/wordslay",
  color: "purple",
});

export default function WordslayPage() {
  return (
    <main>
      <GameJsonLd name="Wordslay" description="Spell words to slay monsters in this roguelike dungeon crawler. How deep can you go?" path="arcade/wordslay" category="arcade" />
      <div className="bg-[#0a0a1a] py-4">
        <LexiconQuestEmbed />
      </div>
      <MoreArcadeGames currentSlug="wordslay" />
    </main>
  );
}
