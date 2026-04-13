import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import GameFAQ from "@/components/seo/GameFAQ";
import SnakeGame from "@/components/SnakeGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Snake Arena — Multiplayer Snake Game Online",
  description:
    "Eat, grow, and devour other players in this multiplayer snake battle. Free online snake game — play instantly in your browser.",
  path: "arcade/snake-arena",
  color: "green",
});

export default function SnakeArenaPage() {
  return (
    <main>
      <GameJsonLd name="Snake Arena" description="Eat, grow, and devour other players in this multiplayer snake battle." path="arcade/snake-arena" category="arcade" />
      <SnakeGame />
      <MoreArcadeGames currentSlug="snake-arena" />

      <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          What is Snake Arena?
        </h2>
        <p>
          Snake Arena is a modern take on the classic snake game with a
          multiplayer twist. Navigate your snake around the arena, eat food pellets
          to grow longer, and try to outlast AI opponents. Crash into a wall or
          another snake and it&apos;s game over — the longer you survive, the higher
          your score.
        </p>
        <p>
          Play Snake Arena free in your browser on Gamesite. The arena gets more
          intense as snakes grow and space runs out. How long can you last?
        </p>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Use the arrow keys or WASD to steer your snake around the arena.</li>
          <li>Eat food pellets to grow longer and increase your score.</li>
          <li>Avoid crashing into walls, your own tail, or other snakes.</li>
          <li>Use boost for a burst of speed when you need to escape a tight spot.</li>
          <li>Survive as long as possible and aim for the highest score.</li>
        </ol>

        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Tips &amp; Strategy
        </h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Stay near the edges early on — the center gets crowded as snakes grow.</li>
          <li>Don&apos;t chase food into tight spaces; getting trapped is the most common way to lose.</li>
          <li>Use your length as a weapon — coil around smaller snakes to cut off their escape routes.</li>
          <li>Save your boost for emergencies rather than using it to chase food.</li>
          <li>Think two turns ahead — by the time you react to a wall, it&apos;s often too late.</li>
        </ul>
      </section>

      <GameFAQ faqs={[
        { question: "Is Snake Arena free to play?", answer: "Yes! Snake Arena is completely free to play on Gamesite. No downloads, no accounts, no hidden fees." },
        { question: "Can I play Snake Arena on my phone?", answer: "Absolutely. Snake Arena works on any device with a modern web browser — phones, tablets, and desktops." },
        { question: "Does Snake Arena save my progress?", answer: "Your high score is tracked locally in your browser. Each game is a fresh run, so jump in and try to beat your personal best anytime." },
        { question: "Can I play Snake Arena with friends?", answer: "Snake Arena is currently a single-player experience where you compete against AI-controlled snakes. The AI opponents grow and behave dynamically, creating an intense arena environment." },
        { question: "What happens when I crash into another snake?", answer: "Crashing into a wall, your own tail, or another snake ends the game. The longer you survive and the more food you eat, the higher your final score." },
      ]} />
    </main>
  );
}
