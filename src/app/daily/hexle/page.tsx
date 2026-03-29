import Link from "next/link";
import HexleGame from "@/components/HexleGame";
import { getHexlePuzzle, getFallbackHexleWord } from "@/lib/hexle-words";

export const revalidate = 60;

export const metadata = {
  title: "Hexle",
  description:
    "Seven guesses to crack the six-letter word. A new puzzle every day.",
};

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default async function HexlePage() {
  const today = getTodayDate();
  let answer = await getHexlePuzzle(today);

  if (!answer) {
    answer = getFallbackHexleWord(today);
  }

  return (
    <main>
      <HexleGame answer={answer} puzzleDate={today} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/hexle/archive"
          className="text-text-muted text-sm hover:text-amber transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
    </main>
  );
}
