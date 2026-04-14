import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import MoreArcadeGames from "@/components/MoreArcadeGames";
import dynamic from "next/dynamic";

const LexiconQuestEmbed = dynamic(
  () => import("@/components/LexiconQuestEmbed"),
  { ssr: false, loading: () => (
    <div className="w-full max-w-[800px] mx-auto bg-[#0a0a1a] flex items-center justify-center rounded-lg" style={{ aspectRatio: "4/3" }}>
      <p className="text-purple-400 font-mono animate-pulse">Loading Lexicon Quest...</p>
    </div>
  )},
);

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
      <div className="bg-[#0a0a1a] py-4">
        <LexiconQuestEmbed />
      </div>
      <MoreArcadeGames currentSlug="lexicon-quest" />
    </main>
  );
}
