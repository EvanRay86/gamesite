import CrosswordGame from "@/components/CrosswordGame";
import { getCrosswordPuzzle } from "@/lib/crossword-puzzles";

export const revalidate = 60;

export default function CrosswordPage() {
  const today = new Date().toISOString().slice(0, 10);
  const puzzle = getCrosswordPuzzle(today);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <CrosswordGame puzzle={puzzle} />
    </div>
  );
}
