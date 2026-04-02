import Link from "next/link";
import {
  getDailyGames,
  getArcadeGames,
  getCommunityGames,
  getFeaturedGame,
  type Game,
} from "@/lib/game-registry";
import {
  colorBg as colorMap,
  colorText as textColorMap,
  colorBgLight as bgLightMap,
  hoverBgSubtle as hoverBgMap,
  borderColor as borderColorMap,
  hoverBorder as hoverBorderMap,
  hoverText as hoverTextMap,
} from "@/lib/color-maps";
import GamePreview from "@/components/GamePreview";

export default function HomePage() {
  const featuredGame = getFeaturedGame();
  const dailyGames = getDailyGames().filter(
    (g) => !g.comingSoon && !g.featured,
  );
  const arcadeGames = getArcadeGames().filter((g) => !g.comingSoon);
  const communityGames = getCommunityGames().filter((g) => !g.comingSoon);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* ── Decorative background blobs (in clipping container) ──────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="hero-blob w-72 h-72 bg-coral/40 -top-20 -left-20" style={{ animationDelay: "0s" }} />
        <div className="hero-blob w-96 h-96 bg-teal/30 top-10 -right-32" style={{ animationDelay: "4s" }} />
        <div className="hero-blob w-64 h-64 bg-purple/25 top-60 left-1/4" style={{ animationDelay: "8s" }} />
      </div>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="text-center mb-12 max-w-3xl animate-[fade-up_0.6s_ease_forwards] relative z-10">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight gradient-text-hero">
          Your daily dose of brain teasers, quick matches, and friendly
          competition.
        </h1>
        <p className="text-text-muted text-base mb-8 animate-[fade-up_0.6s_ease_0.15s_forwards] opacity-0">
          New puzzles every day. No downloads required.
        </p>
        <div className="flex items-center justify-center gap-4 animate-[fade-up_0.6s_ease_0.25s_forwards] opacity-0">
          <Link
            href="/daily"
            className="btn-glow bg-coral text-white rounded-full px-7 py-3 font-bold text-base no-underline
                       hover:bg-coral-dark hover:shadow-xl hover:shadow-coral/30 hover:scale-105 transition-all duration-200"
          >
            Daily Puzzles
          </Link>
          <Link
            href="/arcade"
            className="btn-glow bg-teal text-white rounded-full px-7 py-3 font-bold text-base no-underline
                       hover:shadow-xl hover:shadow-teal/30 hover:scale-105 transition-all duration-200"
          >
            Arcade
          </Link>
        </div>
      </section>

      {/* ── Emoji Ticker ──────────────────────────────────────────────── */}
      <div className="w-full max-w-3xl mb-10 animate-[fade-up_0.6s_ease_0.35s_forwards] opacity-0 relative z-10">
        <div className="emoji-ticker py-3">
          <div className="emoji-ticker-inner">
            {[..."🧩🎯🎵🎬🌍🔢🔤📰🎸🧠🏆⏱️🎮🐨🐍🚀⚔️🕹️🧩🎯🎵🎬🌍🔢🔤📰🎸🧠🏆⏱️🎮🐨🐍🚀⚔️🕹️"].map((emoji, i) => (
              <span key={i} className="text-2xl opacity-60 hover:opacity-100 hover:scale-125 transition-all duration-200 cursor-default select-none">
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Game ──────────────────────────────────────────────── */}
      {featuredGame && (
        <section className="w-full max-w-[1120px] mb-14 animate-[fade-up_0.5s_ease_0.3s_forwards] opacity-0 relative z-10">
          <div className="section-divider mb-8" />
          <h2 className="text-2xl font-bold text-text-primary mb-5">
            Featured
          </h2>
          <FeaturedCard game={featuredGame} />
        </section>
      )}

      {/* ── Today's Puzzles ──────────────────────────────────────────────── */}
      <section id="daily" className="w-full max-w-[1120px] mb-14 animate-[fade-up_0.5s_ease_0.35s_forwards] opacity-0 relative z-10">
        <div className="section-divider mb-8" />
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-bold text-text-primary">
            Today&apos;s Puzzles
          </h2>
          <Link
            href="/daily"
            className="rounded-full px-4 py-1.5 text-sm font-semibold bg-coral/10 text-coral hover:bg-coral/20 transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="masonry-cards">
          {dailyGames.map((game) => (
            <DailyCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* ── Arcade ───────────────────────────────────────────────────────── */}
      <section id="arcade" className="w-full max-w-[1120px] mb-14 animate-[fade-up_0.5s_ease_0.4s_forwards] opacity-0 relative z-10">
        <div className="section-divider mb-8" />
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-bold text-text-primary">Arcade</h2>
          <Link
            href="/arcade"
            className="rounded-full px-4 py-1.5 text-sm font-semibold bg-teal/10 text-teal hover:bg-teal/20 transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="masonry-cards">
          {arcadeGames.map((game) => (
            <ArcadeCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* ── Community ──────────────────────────────────────────────────────── */}
      {communityGames.length > 0 && (
        <section id="community" className="w-full max-w-[1120px] mb-14 animate-[fade-up_0.5s_ease_0.45s_forwards] opacity-0">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xl font-bold text-text-primary">Community</h2>
          </div>

          <div className="masonry-cards">
            {communityGames.map((game) => {
              const gameHref = game.slug === "rift" ? "/rift" : `/arcade/${game.slug}`;
              const gameIcon = game.slug === "rift" ? "\u2694\uFE0F" : "\u{1F3D8}\uFE0F";
              const gameColor = game.slug === "rift" ? "coral" : "green";
              return (
                <Link
                  key={game.slug}
                  href={gameHref}
                  className={`group relative bg-white rounded-xl border border-border-light p-5 shadow-sm
                             hover:shadow-md hover:border-${gameColor}/40 transition-all duration-200 no-underline`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${gameColor}/10 flex items-center justify-center text-lg shrink-0`}>
                      {gameIcon}
                    </div>
                    <div>
                      <h3 className={`text-base font-semibold text-text-primary group-hover:text-${gameColor} transition-colors`}>
                        {game.name}
                      </h3>
                      <p className="text-xs text-text-dim mt-0.5">{game.description}</p>
                      <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-${gameColor} bg-${gameColor}/10 px-2 py-0.5 rounded-full`}>
                        {game.slug === "rift" ? "Competitive" : "Multiplayer"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Social Proof ──────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1120px] mb-14 animate-[fade-up_0.5s_ease_0.5s_forwards] opacity-0 relative z-10">
        <div className="section-divider mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "14", label: "Daily puzzles", color: "coral", icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            )},
            { value: "4", label: "Arcade games", color: "teal", icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" />
              </svg>
            )},
            { value: "Free", label: "No account needed", color: "purple", icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            )},
            { value: "Daily", label: "New puzzles every day", color: "amber", icon: (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            )},
          ].map((stat) => (
            <div key={stat.label} className="clay-card stat-glow p-5 text-center group cursor-default">
              <span className={`text-${stat.color} mb-2 flex justify-center transition-transform duration-200 group-hover:scale-110`}>{stat.icon}</span>
              <p className="text-2xl sm:text-3xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-dim mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

/* ─── Featured Card ─────────────────────────────────────────────────────── */

function FeaturedCard({ game }: { game: Game }) {
  const href = game.slug === "rift" ? "/rift" : game.category === "daily" ? `/daily/${game.slug}` : `/arcade/${game.slug}`;
  return (
    <Link
      href={href}
      className={`group relative block clay-card
                  ${hoverBorderMap[game.color]}
                  overflow-hidden
                  transition-all duration-200 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`h-2 ${colorMap[game.color]}`} />

      <div className="flex flex-col sm:flex-row">
        {/* Preview — left side on desktop */}
        <div className="sm:w-2/5 p-5 flex items-center justify-center">
          <GamePreview slug={game.slug} />
        </div>

        {/* Text — right side on desktop */}
        <div className="sm:w-3/5 p-5 sm:pl-0 flex flex-col justify-center">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${textColorMap[game.color]} mb-1`}>
            Featured
          </span>
          <h3 className={`text-xl font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
            {game.name}
          </h3>
          <p className="text-text-dim text-sm mt-1 leading-relaxed">
            {game.description}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span
              className={`text-sm font-semibold text-white ${colorMap[game.color]} rounded-full px-5 py-1.5
                          group-hover:shadow-md transition-all duration-200 flex items-center gap-1.5`}
            >
              Play now
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── New games badge list ───────────────────────────────────────────────── */

const newGameSlugs = new Set(["chain-reaction", "mathler", "timeline", "quotable", "top-5", "wordsmith"]);

/* ─── Card Components ────────────────────────────────────────────────────── */

function DailyCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/daily/${game.slug}`}
      className={`group relative flex flex-col clay-card
                  ${hoverBorderMap[game.color]}
                  p-5
                  transition-all duration-200 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-6 right-6 h-1.5 ${colorMap[game.color]} rounded-b-full`} />

      <GamePreview slug={game.slug} />

      <div className="flex items-center gap-2">
        <h3 className={`text-lg font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
          {game.name}
        </h3>
        {newGameSlugs.has(game.slug) && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-coral rounded-full px-2 py-0.5 animate-pulse">
            New
          </span>
        )}
      </div>
      <p className="text-text-dim text-sm mt-1 leading-relaxed">
        {game.description}
      </p>

      <div className="flex items-center gap-2 mt-auto pt-3">
        <span
          className={`text-xs font-semibold ${textColorMap[game.color]} ${bgLightMap[game.color]} rounded-full px-3 py-1
                      group-hover:shadow-sm transition-all duration-200 flex items-center gap-1`}
        >
          Play now
          <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function ArcadeCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/arcade/${game.slug}`}
      className={`group relative flex flex-col clay-card
                  ${hoverBorderMap[game.color]}
                  p-5
                  transition-all duration-200 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-6 right-6 h-1.5 ${colorMap[game.color]} rounded-b-full`} />

      <GamePreview slug={game.slug} />

      <h3 className={`text-lg font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
        {game.name}
      </h3>
      <p className="text-text-dim text-sm mt-1 leading-relaxed">
        {game.description}
      </p>

      <div className="flex items-center gap-2 mt-auto pt-3">
        <span
          className={`text-xs font-semibold ${textColorMap[game.color]} ${bgLightMap[game.color]} rounded-full px-3 py-1
                      group-hover:shadow-sm transition-all duration-200 flex items-center gap-1`}
        >
          {game.creditCost === 0 ? "Free to play" : `${game.creditCost} credits`}
          <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
