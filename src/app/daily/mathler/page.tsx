import MathlerGame from "@/components/MathlerGame";
import { getMathlerPuzzle, getTodayDate } from "@/lib/mathler-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Mathler — Gamesite",
  description:
    "Find the hidden math equation that equals the target number. 6 guesses, 6 characters.",
};

export default function MathlerPage() {
  const today = getTodayDate();
  const puzzle = getMathlerPuzzle(today);

  return (
    <main>
      <MathlerGame puzzle={puzzle} date={today} />
    </main>
  );
}
