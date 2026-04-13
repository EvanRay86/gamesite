import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import SkyHopper from "@/components/SkyHopper";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Sky Hopper — Free Flappy Bird Style Game",
  description:
    "Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper. Free browser game, no download.",
  path: "arcade/sky-hopper",
  color: "sky",
});

export default function SkyHopperPage() {
  return (
    <main>
      <GameJsonLd name="Sky Hopper" description="Tap to flap, dodge the pipes, and chase your high score in this endless arcade hopper." path="arcade/sky-hopper" category="arcade" />
      <SkyHopper />
      <MoreArcadeGames currentSlug="sky-hopper" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Sky Hopper?
        </h2>
        <p>
          Sky Hopper is an endless arcade game inspired by Flappy Bird. Tap to
          flap your way through a gauntlet of pipes, timing each jump perfectly to
          squeeze through the gaps. The controls are dead simple — one tap, one
          flap — but mastering the timing takes real skill.
        </p>
        <p>
          Play Sky Hopper free on Gamesite — no download, no install. Just tap and
          try to beat your personal best. Fair warning: it&apos;s addictive.
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Tap or click anywhere on the screen to flap and gain a small burst of altitude.</li>
          <li>Gravity constantly pulls you down — you need to keep tapping to stay airborne.</li>
          <li>Navigate through the gaps between pipes without touching them.</li>
          <li>Each pipe you pass earns one point. Your score resets when you crash.</li>
          <li>Try to beat your high score — every point earned is a victory.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Tap with a steady rhythm rather than panicking — smooth, even taps keep your altitude consistent.</li>
          <li>Focus your eyes slightly ahead of your character, not directly on it.</li>
          <li>Aim for the center of each gap; clipping the edge of a pipe counts as a crash.</li>
          <li>Don&apos;t over-correct. One extra tap at the wrong time sends you into the ceiling.</li>
          <li>Play in short sessions — your reflexes sharpen after a few warm-up rounds.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Sky Hopper free to play?", answer: "Yes! Sky Hopper is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Sky Hopper on my phone?", answer: "Absolutely. Sky Hopper works on any device with a modern web browser — phones, tablets, and desktops. Just tap the screen to flap." },
        { question: "Does Sky Hopper save my progress?", answer: "Your high score is saved locally in your browser. Each run is a fresh attempt, so you can always try to beat your personal best." },
        { question: "How is Sky Hopper different from Flappy Bird?", answer: "Sky Hopper is inspired by Flappy Bird with the same one-tap flight mechanic and pipe obstacles. It features its own visual style and is playable for free right in your browser without any app install." },
        { question: "What is a good score in Sky Hopper?", answer: "Getting past 10 pipes is solid for a beginner. Experienced players often aim for 30 or more. The endless format means there is always room to improve your personal best." },
      ]} />
    </main>
  );
}
