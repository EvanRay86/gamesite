import WordLadderGame from "@/components/WordLadderGame";
import {
  getWordLadderPuzzleByDate,
  getWordLadderPuzzle,
} from "@/lib/word-ladder-puzzles";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function WordLadderArchivePuzzlePage({ params }: Props) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  // Try Supabase first, then fall back to seed data
  let puzzle = await getWordLadderPuzzleByDate(date);
  if (!puzzle) {
    puzzle = getWordLadderPuzzle(date);
  }

  return (
    <main>
      <WordLadderGame puzzle={puzzle} date={date} />
      <div className="fixed bottom-4 left-4">
        <Link
          href="/daily/word-ladder/archive"
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
