import HeardleGame from "@/components/HeardleGame";
import { getHeardlePuzzleAsync, getTodayDate } from "@/lib/heardle-puzzles";

export const revalidate = 60;

export const metadata = {
  title: "Heardle — Gamesite",
  description: "Name the song from its opening seconds. 6 clips, 6 guesses.",
};

export default async function HeardlePage() {
  const today = getTodayDate();
  const puzzle = await getHeardlePuzzleAsync(today, "all");

  return (
    <main>
      <HeardleGame puzzle={puzzle} variant="all" />
    </main>
  );
}
