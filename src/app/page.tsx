import Link from "next/link";
import {
  getDailyGames,
  getArcadeGames,
  type Game,
  type GameColor,
} from "@/lib/game-registry";

const colorMap: Record<GameColor, string> = {
  coral: "bg-coral",
  teal: "bg-teal",
  sky: "bg-sky",
  amber: "bg-amber",
  purple: "bg-purple",
  green: "bg-green",
};

const textColorMap: Record<GameColor, string> = {
  coral: "text-coral",
  teal: "text-teal",
  sky: "text-sky",
  amber: "text-amber",
  purple: "text-purple",
  green: "text-green",
};

const bgLightMap: Record<GameColor, string> = {
  coral: "bg-coral/10",
  teal: "bg-teal/10",
  sky: "bg-sky/10",
  amber: "bg-amber/10",
  purple: "bg-purple/10",
  green: "bg-green/10",
};

const hoverBgMap: Record<GameColor, string> = {
  coral: "hover:bg-coral/5",
  teal: "hover:bg-teal/5",
  sky: "hover:bg-sky/5",
  amber: "hover:bg-amber/5",
  purple: "hover:bg-purple/5",
  green: "hover:bg-green/5",
};

const borderColorMap: Record<GameColor, string> = {
  coral: "border-coral/30",
  teal: "border-teal/30",
  sky: "border-sky/30",
  amber: "border-amber/30",
  purple: "border-purple/30",
  green: "border-green/30",
};

const hoverBorderMap: Record<GameColor, string> = {
  coral: "hover:border-coral",
  teal: "hover:border-teal",
  sky: "hover:border-sky",
  amber: "hover:border-amber",
  purple: "hover:border-purple",
  green: "hover:border-green",
};

const hoverTextMap: Record<GameColor, string> = {
  coral: "group-hover:text-coral",
  teal: "group-hover:text-teal",
  sky: "group-hover:text-sky",
  amber: "group-hover:text-amber",
  purple: "group-hover:text-purple",
  green: "group-hover:text-green",
};

export default function HomePage() {
  const dailyGames = getDailyGames().filter((g) => !g.comingSoon);
  const arcadeGames = getArcadeGames().filter((g) => !g.comingSoon);

  const allGames = [...getDailyGames(), ...getArcadeGames()];
  const comingSoonGames = allGames.filter((g) => g.comingSoon);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="text-center mb-12 max-w-2xl animate-[fade-up_0.6s_ease_forwards]">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3 leading-snug">
          Your daily dose of brain teasers, quick matches, and friendly
          competition.
        </h1>
        <p className="text-text-muted text-sm mb-6 animate-[fade-up_0.6s_ease_0.15s_forwards] opacity-0">
          New puzzles every day. No downloads required.
        </p>
        <div className="flex items-center justify-center gap-3 animate-[fade-up_0.6s_ease_0.25s_forwards] opacity-0">
          <Link
            href="/daily"
            className="bg-coral text-white rounded-full px-6 py-2.5 font-semibold no-underline
                       hover:bg-coral-dark hover:shadow-lg hover:shadow-coral/25 transition-all duration-200"
          >
            Daily Puzzles
          </Link>
          <Link
            href="/arcade"
            className="bg-teal text-white rounded-full px-6 py-2.5 font-semibold no-underline
                       hover:shadow-lg hover:shadow-teal/25 transition-all duration-200"
          >
            Arcade
          </Link>
        </div>
      </section>

      {/* ── Today's Puzzles ──────────────────────────────────────────────── */}
      <section id="daily" className="w-full max-w-[960px] mb-14 animate-[fade-up_0.5s_ease_0.3s_forwards] opacity-0">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary">
            Today&apos;s Puzzles
          </h2>
          <Link
            href="/daily"
            className="text-sm font-semibold text-coral hover:text-coral-dark transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {dailyGames.map((game) => (
            <DailyCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* ── Arcade ───────────────────────────────────────────────────────── */}
      <section id="arcade" className="w-full max-w-[960px] mb-14 animate-[fade-up_0.5s_ease_0.4s_forwards] opacity-0">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary">Arcade</h2>
          <Link
            href="/arcade"
            className="text-sm font-semibold text-teal hover:text-teal transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {arcadeGames.map((game) => (
            <ArcadeCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* ── Coming Soon ──────────────────────────────────────────────────── */}
      <section className="w-full max-w-[960px] mb-14 animate-[fade-up_0.5s_ease_0.5s_forwards] opacity-0">
        <div className="bg-white rounded-2xl border border-border-light p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-text-primary mb-4">
            More games on the way
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {comingSoonGames.map((game) => (
              <span
                key={game.slug}
                className={`${bgLightMap[game.color]} ${textColorMap[game.color]} text-sm font-semibold rounded-full px-4 py-1.5`}
              >
                {game.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscription CTA ─────────────────────────────────────────────── */}
      <section className="w-full max-w-[960px] mb-14 animate-[fade-up_0.5s_ease_0.55s_forwards] opacity-0">
        <div className="relative rounded-2xl bg-gradient-to-br from-coral via-coral-dark to-amber p-8 sm:p-10 text-center text-white shadow-lg shadow-coral/20">
          <h2 className="text-2xl font-bold mb-2">
            Unlock the full experience
          </h2>
          <p className="text-white/80 text-sm max-w-md mx-auto mb-6">
            Subscribe for $6/month to access puzzle archives, earn monthly
            credits, and more.
          </p>
          <Link
            href="/subscribe"
            className="inline-block bg-white text-coral font-bold rounded-full px-8 py-3 no-underline
                       hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="w-full max-w-[960px] pt-6 pb-4 text-center animate-[fade-up_0.5s_ease_0.6s_forwards] opacity-0">
        <p className="text-text-muted text-sm">
          Built for quick breaks and long rivalries.
        </p>
      </footer>
    </main>
  );
}

/* ─── Linked Mini Preview ────────────────────────────────────────────────── */

const linkedWords = [
  { word: "CASH", selected: false },
  { word: "LOVER", selected: true },
  { word: "TABLE", selected: false },
  { word: "NOOK", selected: false },
  { word: "RADIO", selected: true },
  { word: "HEAT", selected: false },
  { word: "FOLKLORE", selected: true },
  { word: "CLUB", selected: false },
  { word: "PHOTO", selected: false },
  { word: "MIDNIGHTS", selected: true },
  { word: "LICENSE", selected: false },
  { word: "BURRITO", selected: false },
  { word: "TIDAL", selected: false },
  { word: "SOUND", selected: false },
  { word: "RECEIPT", selected: false },
  { word: "REPUTATION", selected: false },
];

function LinkedPreview() {
  return (
    <div className="grid grid-cols-4 gap-1.5 mb-4">
      {linkedWords.map(({ word, selected }, i) => (
        <div
          key={i}
          className={`rounded-lg py-2 px-1 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all
            ${selected
              ? "bg-coral text-white shadow-sm"
              : "bg-gray-100 text-text-secondary"
            }`}
        >
          {word}
        </div>
      ))}
    </div>
  );
}

/* ─── Trivia Mini Preview ────────────────────────────────────────────────── */

function TriviaPreview() {
  return (
    <div className="mb-4 rounded-lg bg-sky/5 border border-sky/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky">Question 3 of 8</span>
        <span className="text-[10px] font-bold text-coral tabular-nums">⏱ 5s</span>
      </div>
      <p className="text-xs font-semibold text-text-primary leading-snug mb-2">
        What planet has the most moons in our solar system?
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded bg-white border border-border-light px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">Jupiter</div>
        <div className="rounded bg-sky text-white px-2 py-1.5 text-[10px] font-bold text-center">Saturn</div>
        <div className="rounded bg-white border border-border-light px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">Neptune</div>
        <div className="rounded bg-white border border-border-light px-2 py-1.5 text-[10px] font-medium text-text-secondary text-center">Uranus</div>
      </div>
    </div>
  );
}

/* ─── Slime Mini Preview ─────────────────────────────────────────────────── */

function SlimePreview() {
  return (
    <div className="relative h-16 mb-4 flex items-end justify-center gap-8 overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0.5 h-6 bg-text-dim/30 rounded-t-full" />
      <div className="relative z-10">
        <div className="w-8 h-4 rounded-t-full bg-coral" />
      </div>
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        <div className="w-3 h-3 rounded-full bg-text-primary/60" />
      </div>
      <div className="relative z-10">
        <div className="w-8 h-4 rounded-t-full bg-teal" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-text-dim/20" />
    </div>
  );
}

/* ─── Card Components ────────────────────────────────────────────────────── */

function DailyCard({ game }: { game: Game }) {
  const isLinked = game.slug === "linked";
  const isTrivia = game.slug === "daily-trivia";

  return (
    <Link
      href={`/daily/${game.slug}`}
      className={`group relative block bg-white rounded-2xl border-2 ${borderColorMap[game.color]}
                  ${hoverBorderMap[game.color]} ${hoverBgMap[game.color]}
                  p-5 shadow-sm hover:shadow-md
                  transition-all duration-200 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-6 right-6 h-1 ${colorMap[game.color]} rounded-b-full`} />

      {/* Preview */}
      {isLinked && <LinkedPreview />}
      {isTrivia && <TriviaPreview />}

      <h3 className={`text-lg font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
        {game.name}
      </h3>
      <p className="text-text-dim text-sm mt-1 leading-relaxed">
        {game.description}
      </p>

      <div className="flex items-center gap-2 mt-3">
        <span
          className={`text-xs font-semibold ${textColorMap[game.color]} ${bgLightMap[game.color]} rounded-full px-3 py-1`}
        >
          Play now
        </span>
      </div>
    </Link>
  );
}

function ArcadeCard({ game }: { game: Game }) {
  const isSlime = game.slug === "slime-volleyball";

  return (
    <Link
      href={`/arcade/${game.slug}`}
      className={`group relative block bg-white rounded-2xl border-2 ${borderColorMap[game.color]}
                  ${hoverBorderMap[game.color]} ${hoverBgMap[game.color]}
                  p-5 shadow-sm hover:shadow-md
                  transition-all duration-200 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-6 right-6 h-1 ${colorMap[game.color]} rounded-b-full`} />

      {isSlime && <SlimePreview />}

      <h3 className={`text-lg font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
        {game.name}
      </h3>
      <p className="text-text-dim text-sm mt-1 leading-relaxed">
        {game.description}
      </p>

      <div className="flex items-center gap-2 mt-3">
        <span
          className={`text-xs font-semibold ${textColorMap[game.color]} ${bgLightMap[game.color]} rounded-full px-3 py-1`}
        >
          {game.creditCost === 0 ? "Free to play" : `${game.creditCost} credits`}
        </span>
      </div>
    </Link>
  );
}
