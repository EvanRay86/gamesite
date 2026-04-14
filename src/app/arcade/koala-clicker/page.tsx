import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import KoalaClicker from "@/components/KoalaClicker";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Koala Clicker — Free Idle Clicker Game",
  description:
    "Click the koala, collect eucalyptus leaves, and build the ultimate koala colony. Free idle clicker game — no download needed.",
  path: "arcade/koala-clicker",
  color: "green",
});

export default function KoalaClickerPage() {
  return (
    <main>
      <GameJsonLd name="Koala Clicker" description="Click the koala, collect eucalyptus leaves, and build the ultimate koala colony." path="arcade/koala-clicker" category="arcade" />
      <div className="overflow-hidden max-h-[100dvh]">
        <KoalaClicker />
      </div>
      <div className="hidden lg:block">
        <MoreArcadeGames currentSlug="koala-clicker" />
      </div>

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Koala Clicker?
        </h2>
        <p>
          Koala Clicker is a free idle clicker game where you click a koala to
          collect eucalyptus leaves, unlock upgrades, and build the ultimate koala
          colony. Start with a single koala and a single click, then scale up with
          auto-clickers, habitats, and multipliers that keep earning even when
          you&apos;re away.
        </p>
        <p>
          Play Koala Clicker free on Gamesite — your progress is saved
          automatically in your browser so you can come back anytime and pick up
          where you left off. No download needed.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click the koala to earn eucalyptus leaves — each click earns one leaf (or more with upgrades).</li>
          <li>Spend leaves in the shop to buy upgrades that increase your leaves per click.</li>
          <li>Unlock auto-clickers that generate leaves passively over time.</li>
          <li>Purchase new habitats and helpers to multiply your earnings.</li>
          <li>Keep upgrading to reach higher milestones and unlock new content.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Prioritize auto-clickers early — passive income lets you earn even when you step away.</li>
          <li>Check the cost-to-benefit ratio of each upgrade before buying; cheaper isn&apos;t always better value.</li>
          <li>Don&apos;t hoard leaves. Spending them on upgrades compounds your earnings over time.</li>
          <li>Come back regularly to collect idle earnings and reinvest in new upgrades.</li>
          <li>Save up for the big milestone upgrades — they often unlock powerful multipliers.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Koala Clicker free to play?", answer: "Yes! Koala Clicker is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Koala Clicker on my phone?", answer: "Absolutely. Koala Clicker works on any device with a modern web browser — phones, tablets, and desktops. Tapping works just like clicking." },
        { question: "Does Koala Clicker save my progress?", answer: "Yes, your progress is saved automatically in your browser. You can close the tab and come back later to collect your idle earnings and continue upgrading." },
        { question: "Do I earn leaves while I am away?", answer: "Yes! Once you unlock auto-clickers and passive income upgrades, your koala colony keeps earning eucalyptus leaves even when you are not playing. Come back to collect your idle earnings." },
        { question: "Is there an end to Koala Clicker?", answer: "Koala Clicker is an idle game with escalating milestones and upgrades. There is always a new goal to work toward, so you can keep playing as long as you like." },
      ]} />
    </main>
  );
}
