import WordLadderGame from "@/components/WordLadderGame";
import { getWordLadderPuzzle, getTodayDate } from "@/lib/word-ladder-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Word Ladder — Gamesite",
  description:
    "Change one letter at a time to transform the start word into the target word.",
};

export default function WordLadderPage() {
  const today = getTodayDate();
  const puzzle = getWordLadderPuzzle(today);

  return (
    <main>
      <WordLadderGame puzzle={puzzle} date={today} />
    </main>
  );
}
