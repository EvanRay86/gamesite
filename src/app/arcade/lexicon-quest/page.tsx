import LexiconQuest from "@/components/LexiconQuest";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = {
  title: "Lexicon Quest — Word-Powered Roguelike",
  description:
    "Spell words to slay monsters in this roguelike dungeon crawler. Collect relics, potions, and gold as you descend through procedural dungeons.",
};

export default function LexiconQuestPage() {
  return (
    <main>
      <LexiconQuest />
      <MoreArcadeGames currentSlug="lexicon-quest" />
    </main>
  );
}
