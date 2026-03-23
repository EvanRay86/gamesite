import LinkedGame from "@/components/LinkedGame";
import { getPuzzleByDate, getTodayDate, getFallbackPuzzle } from "@/lib/puzzles";
import Link from "next/link";

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
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Link
          href="/archive"
          className="bg-surface text-text-muted border border-border-light
                     rounded-full px-4 py-2 text-xs font-semibold
                     hover:bg-surface-hover hover:text-text-secondary transition-all
                     no-underline"
        >
          Archive
        </Link>
        <Link
          href="/"
          className="bg-surface text-text-muted border border-border-light
                     rounded-full px-4 py-2 text-xs font-semibold
                     hover:bg-surface-hover hover:text-text-secondary transition-all
                     no-underline"
        >
          All Games
        </Link>
      </div>
    </main>
  );
}
