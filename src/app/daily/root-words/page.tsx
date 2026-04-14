import Link from "next/link";
import RootWordsGame from "@/components/RootWordsGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import { getRootWordsPuzzleByDate, getTodayDate, getFallbackRootWordsPuzzle } from "@/lib/root-words-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Root Words — Latin & Greek Word Roots Game",
  description: "Find English words built from Latin and Greek roots before time runs out. A free daily vocabulary and etymology game.",
  path: "daily/root-words",
  color: "teal",
});

export default async function RootWordsPage() {
  const today = getTodayDate();
  let puzzle = await getRootWordsPuzzleByDate(today);
  if (!puzzle) puzzle = getFallbackRootWordsPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Root Words" description="Find English words built from a Latin or Greek root. A new root every day." path="daily/root-words" category="daily" />
      <RootWordsGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link href="/daily/root-words/archive" className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline">Play past puzzles &rarr;</Link>
        <Link href="/daily/root-words/hints" className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">Need a hint?</Link>
      </div>
      <MoreDailyGames currentSlug="root-words" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">What is Root Words?</h2>
        <p>Root Words is a free daily etymology game that teaches you the building blocks of the English language. Each day you are given a Latin or Greek root along with its meaning, and your goal is to find as many English words as possible that contain that root. It is a fun, timed challenge that naturally expands your vocabulary and deepens your understanding of where words come from.</p>
        <p>A new root is available every day on Gamesite. Play in your browser on any device — no account or download needed. Whether you are a student, a language enthusiast, or just curious about words, Root Words makes learning etymology genuinely enjoyable.</p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">How to Play</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>A root and its meaning are displayed — for example, &quot;CHRON&quot; meaning &quot;time.&quot;</li>
          <li>You have 90 seconds to find as many English words as possible containing that root.</li>
          <li>Type a word and press Enter. Valid words must be at least 4 letters and exist in the dictionary.</li>
          <li>Points are awarded by word length: 1 point for 4-5 letters, 2 for 6-7, 3 for 8 or more.</li>
          <li>When the timer runs out, see your final score and all the words you found.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Tips &amp; Strategy</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with the most obvious words first — if the root is &quot;BIO,&quot; &quot;biology&quot; and &quot;biography&quot; should come immediately.</li>
          <li>Think about common prefixes and suffixes. Adding &quot;un-,&quot; &quot;re-,&quot; &quot;-tion,&quot; &quot;-ology,&quot; or &quot;-ical&quot; to a root often yields valid words.</li>
          <li>Do not forget less common but valid words. Scientific and medical terms frequently use Latin and Greek roots.</li>
          <li>Longer words score more, but do not waste time on one long word when three short ones earn more total.</li>
          <li>Play daily to build your root vocabulary. Over time, you will start recognizing roots in unfamiliar words — a genuine superpower for reading comprehension.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Root Words free to play?", answer: "Yes! Root Words is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Root Words on my phone?", answer: "Absolutely. Root Words works on any device with a modern web browser — phones, tablets, and desktops." },
        { question: "How often does Root Words update?", answer: "A brand-new root word puzzle is published every day. Come back tomorrow for a fresh challenge." },
        { question: "What kinds of roots does Root Words feature?", answer: "Each puzzle features a Latin or Greek root along with its meaning. Roots like CHRON (time), BIO (life), GRAPH (write), and JECT (throw) are examples of the building blocks you will explore." },
        { question: "How long do I have to find words?", answer: "You have 90 seconds to find as many English words as possible containing the daily root. Points are awarded based on word length: 1 point for 4-5 letters, 2 for 6-7, and 3 for 8 or more." },
      ]} />
    </main>
  );
}
