import Link from "next/link";
import VocabVaultGame from "@/components/VocabVaultGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { getVocabVaultPuzzleByDate, getTodayDate, getFallbackVocabVaultPuzzle } from "@/lib/vocab-vault-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Vocab Vault — Daily Vocabulary Quiz from Definitions",
  description: "Guess vocabulary words from definitions and example sentences. Build your vocabulary with this free daily word game.",
  path: "daily/vocab-vault",
  color: "purple",
});

export default async function VocabVaultPage() {
  const today = getTodayDate();
  let puzzle = await getVocabVaultPuzzleByDate(today);
  if (!puzzle) puzzle = getFallbackVocabVaultPuzzle(today);

  return (
    <main>
      <GameJsonLd name="Vocab Vault" description="Guess vocabulary words from definitions and example sentences. Five words, three attempts each." path="daily/vocab-vault" category="daily" />
      <VocabVaultGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link href="/daily/vocab-vault/archive" className="inline-flex items-center gap-2 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline">
          Play past puzzles &rarr;
        </Link>
        <Link href="/daily/vocab-vault/hints" className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="vocab-vault" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">What is Vocab Vault?</h2>
        <p>Vocab Vault is a free daily vocabulary game that challenges you to guess words from their definitions and example sentences. Each day features five carefully selected words ranging from commonly tested SAT and GRE vocabulary to everyday words that sharpen your language skills. With three attempts per word, you will need to draw on your vocabulary knowledge and use context clues from the example sentences to succeed.</p>
        <p>A new set of five words is available every day on Gamesite. Play in your browser on any device — no account or download required. It is the perfect daily exercise for students preparing for standardized tests, language learners expanding their English vocabulary, or anyone who loves words.</p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">How to Play</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Read the definition and the example sentence carefully. The target word is blanked out in the sentence.</li>
          <li>Type your guess and press Enter. Correct answers earn 3 points on the first try.</li>
          <li>If wrong, a hint is revealed — the first letter of the word. Your second attempt earns 2 points.</li>
          <li>A third attempt reveals the first and last letter. This attempt earns 1 point.</li>
          <li>After three wrong guesses the answer is shown and you move to the next word. Score up to 15 points total.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Tips &amp; Strategy</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Read the example sentence before the definition — context clues often narrow the answer more than the definition alone.</li>
          <li>Pay attention to word length. The blank in the sentence hints at how long the word is.</li>
          <li>Think about word roots. If the definition mentions &quot;against&quot; or &quot;opposite,&quot; the answer might start with &quot;anti-&quot; or &quot;counter-.&quot;</li>
          <li>Do not overthink it. Common words appear alongside challenging ones, so your first instinct may be correct.</li>
          <li>Play every day to build your vocabulary naturally. Repetition and exposure are the best ways to learn new words.</li>
        </ul>
      </section>
    </main>
  );
}
