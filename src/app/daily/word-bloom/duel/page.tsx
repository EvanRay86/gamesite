import WordBloomDuel from "@/components/WordBloomDuel";
import Link from "next/link";

export const metadata = {
  title: "Word Bloom Duel — Gamesite",
  description: "Challenge a friend to a 60-second Word Bloom duel!",
};

export default function WordBloomDuelPage() {
  return (
    <main>
      <WordBloomDuel />
      <div className="flex justify-center py-4">
        <Link
          href="/daily/word-bloom"
          className="rounded-full px-4 py-1.5 text-sm font-medium bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors no-underline"
        >
          &larr; Back to daily puzzle
        </Link>
      </div>
    </main>
  );
}
