import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
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
      <div className="flex justify-center bg-[#0a0a1a] py-4">
        <iframe
          src="/lexicon-quest/index.html"
          width="800"
          height="600"
          className="border-0 rounded-lg shadow-2xl max-w-full"
          style={{ aspectRatio: "4/3" }}
          allow="autoplay"
          title="Lexicon Quest"
        />
      </div>
      <MoreArcadeGames currentSlug="lexicon-quest" />
    </main>
  );
}
