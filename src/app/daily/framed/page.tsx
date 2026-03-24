import FramedGame from "@/components/FramedGame";
import { getFramedPuzzleAsync, getTodayDate } from "@/lib/framed-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Framed — Gamesite",
  description: "Guess the movie one frame at a time. 6 frames, 6 guesses.",
};

export default async function FramedPage() {
  const today = getTodayDate();
  const puzzle = await getFramedPuzzleAsync(today, "all");

  return (
    <main>
      <FramedGame puzzle={puzzle} variant="all" />
    </main>
  );
}
