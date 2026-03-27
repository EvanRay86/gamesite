import CrosswordGame from "@/components/CrosswordGame";
import { getCrosswordPuzzle } from "@/lib/crossword-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "News Crossword",
  description:
    "A daily crossword puzzle built from today's headlines and pop culture.",
};

export default async function CrosswordPage() {
  const today = new Date().toISOString().slice(0, 10);
  const puzzle = await getCrosswordPuzzle(today);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <CrosswordGame puzzle={puzzle} />
    </div>
  );
}
