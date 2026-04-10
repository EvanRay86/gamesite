import Link from "next/link";
import EmojiWordGame from "@/components/EmojiWordGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import {
  getEmojiWordPuzzleByDate,
  getTodayDate,
  getFallbackEmojiWordPuzzle,
} from "@/lib/emoji-word-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Emoji Decoder — Guess the Word from Emojis | Daily Puzzle",
  description:
    "Guess words and phrases from emoji clues across five progressively harder rounds. Free daily emoji guessing game.",
  path: "daily/emoji-word",
  color: "amber",
});

export default async function EmojiWordPage() {
  const today = getTodayDate();

  let puzzle = await getEmojiWordPuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackEmojiWordPuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Emoji Decoder" description="Guess the word or phrase from emoji clues. Five rounds that get progressively harder. A new challenge every day." path="daily/emoji-word" category="daily" />
      <EmojiWordGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/emoji-word/archive"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/emoji-word/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="emoji-word" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Emoji Decoder?
        </h2>
        <p>
          Emoji Decoder is a daily puzzle game where you guess words or phrases
          represented by a sequence of emojis. Each round shows you a string of
          emojis and you need to figure out what word, phrase, or concept they
          represent. With five rounds that get progressively harder, it is a fun
          test of lateral thinking and pop-culture knowledge.
        </p>
        <p>
          New emoji puzzles are published every day on Gamesite. Play for free in
          your browser — no app or account needed. It is a great game to play with
          friends and see who can decode the emojis fastest.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Each round displays a series of emojis representing a word or phrase.</li>
          <li>Study the emojis and think about what concept they might represent together.</li>
          <li>Type your guess and submit.</li>
          <li>Correct answers advance you to the next round. Rounds get harder as you progress.</li>
          <li>Complete all five rounds to finish the puzzle.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Look at the emojis as a whole rather than translating each one individually — they usually represent a single concept.</li>
          <li>Consider idioms, movie titles, song names, and common phrases. Emojis often encode pop culture references.</li>
          <li>Pay attention to the number of emojis — it can hint at whether the answer is one word or a multi-word phrase.</li>
          <li>If your first interpretation does not work, try thinking more abstractly about what the emojis could symbolize.</li>
          <li>Later rounds are harder, so do not spend too long on early ones — save your mental energy.</li>
        </ul>
      </section>
    </main>
  );
}
