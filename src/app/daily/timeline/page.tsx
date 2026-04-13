import Link from "next/link";
import TimelineGame from "@/components/TimelineGame";
import MoreDailyGames from "@/components/MoreDailyGames";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import {
  getTimelinePuzzleByDate,
  getTodayDate,
  getFallbackTimelinePuzzle,
} from "@/lib/timeline-puzzles";
import { buildGameMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata = buildGameMetadata({
  title: "Timeline — Put Events in Chronological Order | History Game",
  description:
    "Put five historical events in the correct chronological order. Test your history knowledge in this free daily timeline game.",
  path: "daily/timeline",
  color: "teal",
});

export default async function TimelinePage() {
  const today = getTodayDate();

  let puzzle = await getTimelinePuzzleByDate(today);

  if (!puzzle) {
    puzzle = getFallbackTimelinePuzzle(today);
  }

  return (
    <main>
      <GameJsonLd name="Timeline" description="Put five events in chronological order. A new challenge every day." path="daily/timeline" category="daily" />
      <TimelineGame puzzle={puzzle} />
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <Link
          href="/daily/timeline/archive"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-90 hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
        <Link
          href="/daily/timeline/hints"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 hover:shadow-md active:scale-95 transition-all no-underline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Need a hint?
        </Link>
      </div>
      <MoreDailyGames currentSlug="timeline" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Timeline?
        </h2>
        <p>
          Timeline is a daily history game where you put five events in
          chronological order. The events span centuries and categories — from
          ancient history and scientific discoveries to pop culture milestones and
          political events. You have three attempts to arrange them correctly,
          making each guess count.
        </p>
        <p>
          A new Timeline challenge is published every day on Gamesite. Play for
          free in your browser on any device. It is a fantastic way to test and
          expand your knowledge of history while having fun. No account or
          download required.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Five historical events are presented in random order.</li>
          <li>Drag and drop them into chronological order from earliest to latest.</li>
          <li>Submit your arrangement. Correctly placed events are locked in.</li>
          <li>You have three attempts total to get the order right.</li>
          <li>Place all five events correctly to win.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Start with the events you are most confident about — anchoring even one or two events makes the rest easier.</li>
          <li>Use context clues in the event descriptions. Technology-related events often have implicit era hints.</li>
          <li>Think in terms of centuries first, then narrow down. Knowing an event is &quot;1800s&quot; vs &quot;1900s&quot; is often enough.</li>
          <li>If two events feel like they happened around the same time, look for cause-and-effect relationships between them.</li>
          <li>The more you play, the better your historical intuition becomes — Timeline is genuinely educational.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Timeline free to play?", answer: "Yes! Timeline is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Timeline on my phone?", answer: "Absolutely. Timeline works on any device with a modern web browser — phones, tablets, and desktops. Drag and drop works with touch controls." },
        { question: "How often does Timeline update?", answer: "A brand-new Timeline puzzle is published every day. Come back tomorrow for a fresh challenge." },
        { question: "How many attempts do I get in Timeline?", answer: "You have three attempts to arrange the five events in the correct chronological order. After each attempt, correctly placed events are locked in so you can focus on the remaining ones." },
        { question: "What time periods do the events cover?", answer: "Events span from ancient history to modern times, covering everything from scientific discoveries and political milestones to pop culture moments and technological breakthroughs." },
      ]} />
    </main>
  );
}
