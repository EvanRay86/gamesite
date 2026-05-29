import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import OutrankGame from "@/components/OutrankGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";
import { getOutrankPool } from "@/lib/outrank-data";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Outrank — Which Is More? Higher or Lower Streak Game",
  description:
    "Two things, one question: which is more? Build an endless streak guessing the bigger value, then challenge a friend to beat your score. Free, no download.",
  path: "arcade/outrank",
  color: "sky",
});

export default async function OutrankPage() {
  const pool = await getOutrankPool();

  return (
    <main>
      <GameJsonLd
        name="Outrank"
        description="Two things, one question: which is more? Build an endless streak and challenge a friend to beat your score."
        path="arcade/outrank"
        category="arcade"
      />
      <OutrankGame mode="solo" pool={pool} />
      <MoreArcadeGames currentSlug="outrank" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Outrank?
        </h2>
        <p>
          Outrank is a fast, addictive &ldquo;which is more?&rdquo; guessing
          game. You&apos;re shown two things from the same category — two cities,
          two movies, two snacks — and one question: which one has the bigger
          number? Pick correctly and your streak grows. Pick wrong and the run
          ends. It&apos;s the classic higher-or-lower format, endless and
          score-based.
        </p>
        <p>
          The twist: when your run ends, you can mint a challenge link that
          replays your exact game for a friend. They see &ldquo;you scored 27 —
          can you beat it?&rdquo; and face the identical sequence of matchups.
          It&apos;s a head-to-head duel you can send in any DM. Play free on
          Gamesite — no download, no account.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Read the question at the top — it tells you what you&apos;re comparing (population, box office, height, and more).</li>
          <li>You&apos;re shown two options side by side. Tap the one you think has the bigger value.</li>
          <li>Both values are revealed. Guess right and your streak goes up by one; guess wrong and the run is over.</li>
          <li>The categories keep rotating, so every pick is a fresh apples-to-apples comparison.</li>
          <li>When you&apos;re done, challenge a friend to beat your streak with a shareable link.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>When two options feel close, go with the one that&apos;s more famous or widely known — fame usually tracks the bigger number.</li>
          <li>For cities, think metro area, not just the city limits — sprawl adds up fast.</li>
          <li>Blockbusters with sequels and global releases almost always out-gross one-off films.</li>
          <li>Don&apos;t overthink it. Your first instinct is right more often than a second-guess.</li>
          <li>Read the reveal blurbs — you&apos;ll learn surprising facts that help on future rounds.</li>
        </ul>
      </section>

      <GameFAQ
        faqs={[
          {
            question: "Is Outrank free to play?",
            answer:
              "Yes! Outrank is completely free on Gamesite. No downloads, no accounts, no hidden fees — just open it and play.",
          },
          {
            question: "How do challenge links work?",
            answer:
              "When your run ends, enter your name and create a challenge link. It replays your exact game — the same matchups in the same order — for whoever you send it to, so it's a fair head-to-head. They'll see your score and try to beat it.",
          },
          {
            question: "Does the challenge give my friend the same questions?",
            answer:
              "Exactly the same. Each game is generated from a seed, and your challenge link stores that seed. Your friend faces the identical sequence of comparisons, so beating your streak is a true apples-to-apples contest.",
          },
          {
            question: "Can I play Outrank on my phone?",
            answer:
              "Yes. Outrank works on any device with a modern web browser — phones, tablets, and desktops. Just tap the option you think is bigger.",
          },
          {
            question: "What's a good score in Outrank?",
            answer:
              "Getting a streak of 10 is solid. Past 20 is genuinely impressive, and the endless format means there's always a higher score to chase.",
          },
        ]}
      />
    </main>
  );
}
