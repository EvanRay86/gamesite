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
          className="text-text-muted text-sm hover:text-green transition-colors no-underline"
        >
          &larr; Back to daily puzzle
        </Link>
      </div>
    </main>
  );
}
