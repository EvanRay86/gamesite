import Top5Game from "@/components/Top5Game";
import { getTop5PuzzleByDate, getFallbackTop5Puzzle } from "@/lib/top5-puzzles";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function Top5ArchivePuzzlePage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  let puzzle = await getTop5PuzzleByDate(date);
  if (!puzzle) {
    puzzle = getFallbackTop5Puzzle(date);
  }

  return (
    <main>
      <Top5Game puzzle={puzzle} />
      <div className="fixed bottom-4 left-4">
        <Link
          href="/daily/top-5/archive"
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
