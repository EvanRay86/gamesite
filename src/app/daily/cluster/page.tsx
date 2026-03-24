import ClusterGame from "@/components/ClusterGame";
import { getPuzzleByDate, getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";

export const revalidate = 60;

export default async function ClusterPage() {
  const today = getTodayDate();
  let puzzle = await getPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackPuzzle(today);
  }

  return (
    <main>
      <ClusterGame puzzle={puzzle} />
    </main>
  );
}
