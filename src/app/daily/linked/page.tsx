import LinkedGame from "@/components/LinkedGame";
import { getPuzzleByDate, getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";

export const revalidate = 60;

export default async function LinkedPage() {
  const today = getTodayDate();
  let puzzle = await getPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackPuzzle(today);
  }

  return (
    <main>
      <LinkedGame puzzle={puzzle} />
    </main>
  );
}
