import LinkedGame from "@/components/LinkedGame";
import { getPuzzleByDate, getFallbackPuzzle } from "@/lib/puzzles";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function ArchivePuzzlePage({ params }: Props) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  let puzzle = await getPuzzleByDate(date);
  if (!puzzle) {
    puzzle = getFallbackPuzzle(date);
  }

  return (
    <main>
      <LinkedGame puzzle={puzzle} />
      <div className="fixed bottom-4 left-4">
        <Link
          href="/daily/linked/archive"
          className="bg-surface text-text-muted border border-border-light
                     rounded-full px-4 py-2 text-xs font-semibold
                     hover:bg-surface-hover hover:text-text-secondary transition-all
                     no-underline"
        >
          &larr; Archive
        </Link>
      </div>
    </main>
  );
}
