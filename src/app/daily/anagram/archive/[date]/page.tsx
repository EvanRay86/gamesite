import AnagramGame from "@/components/AnagramGame";
import { getAnagramPuzzleByDate, getFallbackAnagramPuzzle } from "@/lib/anagram-puzzles";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function AnagramArchivePuzzlePage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  let puzzle = await getAnagramPuzzleByDate(date);
  if (!puzzle) {
    puzzle = getFallbackAnagramPuzzle(date);
  }

  return (
    <main>
      <AnagramGame puzzle={puzzle} />
      <div className="fixed bottom-4 left-4">
        <Link
          href="/daily/anagram/archive"
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
