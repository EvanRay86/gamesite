import WordsmithGame from "@/components/WordsmithGame";

export const metadata = {
  title: "Wordsmith — Gamesite",
  description:
    "Forge words through five rounds, collect power-ups, and chase the daily high score.",
};

export default function WordsmithPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <WordsmithGame dateStr={today} />
    </main>
  );
}
