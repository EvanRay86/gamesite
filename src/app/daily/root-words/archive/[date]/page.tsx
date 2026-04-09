import RootWordsGame from "@/components/RootWordsGame";
import { getRootWordsPuzzleByDate, getFallbackRootWordsPuzzle } from "@/lib/root-words-puzzles";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ date: string }>; }

export default async function RootWordsArchivePuzzlePage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  let puzzle = await getRootWordsPuzzleByDate(date);
  if (!puzzle) puzzle = getFallbackRootWordsPuzzle(date);
  return (
    <main>
      <RootWordsGame puzzle={puzzle} />
      <div className="fixed bottom-4 left-4">
        <Link href="/daily/root-words/archive" className="bg-surface text-text-muted border border-border-light rounded-full px-4 py-2 text-xs font-semibold hover:bg-surface-hover hover:text-text-secondary transition-all no-underline">&larr; Archive</Link>
      </div>
    </main>
  );
}
