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
  gameCardColor,
  statCardColor,
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
      {/* ── Decorative background blobs ───────────────────────────────── */}
      <div className="hero-blob w-72 h-72 bg-coral/40 -top-20 -left-20" style={{ animationDelay: "0s" }} />
      <div className="hero-blob w-96 h-96 bg-teal/30 top-10 -right-32" style={{ animationDelay: "4s" }} />
      <div className="hero-blob w-64 h-64 bg-purple/25 top-60 left-1/4" style={{ animationDelay: "8s" }} />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="text-center mb-14 max-w-3xl animate-[fade-up_0.6s_ease_forwards] relative z-10">
        <h1 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight gradient-text-hero">
          Your daily dose of brain teasers, quick matches, and friendly
          competition.
        </h1>
        <p className="text-text-muted text-base sm:text-lg mb-9 animate-[fade-up_0.6s_ease_0.15s_forwards] opacity-0 max-w-xl mx-auto">
          New puzzles every day. No downloads required.
        </p>
        <div className="flex items-center justify-center gap-4 animate-[fade-up_0.6s_ease_0.25s_forwards] opacity-0">
          <Link
            href="/daily"
            className="btn-glow bg-coral text-white rounded-full px-8 py-3.5 font-bold text-base no-underline
                       hover:bg-coral-dark hover:shadow-xl hover:shadow-coral/25 hover:scale-105 transition-all duration-200"
          >
            Daily Puzzles
          </Link>
          <Link
            href="/arcade"
            className="btn-glow bg-teal text-white rounded-full px-8 py-3.5 font-bold text-base no-underline
                       hover:shadow-xl hover:shadow-teal/25 hover:scale-105 transition-all duration-200"
          >
            Arcade
          </Link>
        </div>
      </section>

      {/* ── Emoji Ticker ──────────────────────────────────────────────── */}
      <div className="w-full max-w-3xl mb-12 animate-[fade-up_0.6s_ease_0.35s_forwards] opacity-0 relative z-10">
        <div className="emoji-ticker py-3">
          <div className="emoji-ticker-inner">
            {[..."🧩🎯🎵🎬🌍🔢🔤📰🎸🧠🏆⏱️🎮🐨🐍🚀⚔️🕹️🧩🎯🎵🎬🌍🔢🔤📰🎸🧠🏆⏱️🎮🐨🐍🚀⚔️🕹️"].map((emoji, i) => (
              <span key={i} className="text-2xl opacity-50 hover:opacity-100 hover:scale-125 transition-all duration-200 cursor-default select-none">
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Game ──────────────────────────────────────────────── */}
      {featuredGame && (
        <section className="w-full max-w-[1120px] mb-16 animate-[fade-up_0.5s_ease_0.3s_forwards] opacity-0 relative z-10">
          <SectionHeader title="Featured" />
          <FeaturedCard game={featuredGame} />
        </section>
      )}

      {/* ── Today's Puzzles ──────────────────────────────────────────────── */}
      <section id="daily" className="w-full max-w-[1120px] mb-16 animate-[fade-up_0.5s_ease_0.35s_forwards] opacity-0 relative z-10">
        <SectionHeader title="Today's Puzzles" href="/daily" linkText="View all" />

        <div className="masonry-cards">
          {dailyGames.map((game) => (
            <DailyCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* ── Arcade ───────────────────────────────────────────────────────── */}
      <section id="arcade" className="w-full max-w-[1120px] mb-16 animate-[fade-up_0.5s_ease_0.4s_forwards] opacity-0 relative z-10">
        <SectionHeader title="Arcade" href="/arcade" linkText="View all" linkColor="teal" />

        <div className="masonry-cards">
          {arcadeGames.map((game) => (
            <ArcadeCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* ── Community ──────────────────────────────────────────────────────── */}
      {communityGames.length > 0 && (
        <section id="community" className="w-full max-w-[1120px] mb-16 animate-[fade-up_0.5s_ease_0.45s_forwards] opacity-0">
          <SectionHeader title="Community" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communityGames.map((game) => {
              const gameHref = game.slug === "rift" ? "/rift" : `/arcade/${game.slug}`;
              const gameIcon = game.slug === "rift" ? "\u2694\uFE0F" : "\u{1F3D8}\uFE0F";
              const gameColor = game.slug === "rift" ? "coral" : "green";
              return (
                <Link
                  key={game.slug}
                  href={gameHref}
                  className={`group relative game-card ${gameColor === "coral" ? "game-card-coral" : "game-card-green"} p-6 no-underline`}
                >
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-${gameColor}/10 flex items-center justify-center text-xl shrink-0
                                    group-hover:scale-110 transition-transform duration-300`}>
                      {gameIcon}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold text-text-primary group-hover:text-${gameColor} transition-colors duration-200`}>
                        {game.name}
                      </h3>
                      <p className="text-xs text-text-dim mt-1 leading-relaxed">{game.description}</p>
                      <span className={`inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-${gameColor} bg-${gameColor}/8 px-2.5 py-1 rounded-full`}>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "14", label: "Daily puzzles", color: "coral" as const, icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            )},
            { value: "4", label: "Arcade games", color: "teal" as const, icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" />
              </svg>
            )},
            { value: "Free", label: "No account needed", color: "purple" as const, icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            )},
            { value: "Daily", label: "New puzzles every day", color: "amber" as const, icon: (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            )},
          ].map((stat) => (
            <div key={stat.label} className={`stat-card ${statCardColor[stat.color]} group cursor-default`}>
              <span className={`text-${stat.color} mb-2 flex justify-center transition-transform duration-300 group-hover:scale-110`}>{stat.icon}</span>
              <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-1">{stat.value}</p>
              <p className="text-[11px] text-text-dim mt-1.5 tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

/* ─── Section Header ───────────────────────────────────────────────────── */

function SectionHeader({
  title,
  href,
  linkText,
  linkColor = "coral",
}: {
  title: string;
  href?: string;
  linkText?: string;
  linkColor?: string;
}) {
  return (
    <div className="mb-6">
      <div className="page-header-bar w-16 mb-5" />
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {href && linkText && (
          <Link
            href={href}
            className={`text-sm font-semibold text-${linkColor} hover:text-${linkColor}-dark transition-colors no-underline flex items-center gap-1`}
          >
            {linkText}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Featured Card ─────────────────────────────────────────────────────── */

function FeaturedCard({ game }: { game: Game }) {
  const href = game.slug === "rift" ? "/rift" : game.category === "daily" ? `/daily/${game.slug}` : `/arcade/${game.slug}`;
  return (
    <Link
      href={href}
      className={`group relative block game-card ${gameCardColor[game.color]} shimmer-on-hover
                  transition-all duration-300 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`game-card-accent ${colorMap[game.color]}`} />

      <div className="flex flex-col sm:flex-row">
        {/* Preview — left side on desktop */}
        <div className="sm:w-2/5 p-6 flex items-center justify-center">
          <GamePreview slug={game.slug} />
        </div>

        {/* Text — right side on desktop */}
        <div className="sm:w-3/5 p-6 sm:pl-0 flex flex-col justify-center">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${textColorMap[game.color]} mb-1.5`}>
            Featured
          </span>
          <h3 className={`text-xl font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
            {game.name}
          </h3>
          <p className="text-text-dim text-sm mt-2 leading-relaxed">
            {game.description}
          </p>
          <div className="flex items-center gap-2 mt-5">
            <span
              className={`play-btn text-white ${colorMap[game.color]}
                          group-hover:shadow-md transition-all duration-200`}
            >
              Play now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
      className={`group relative flex flex-col game-card ${gameCardColor[game.color]}
                  p-5 transition-all duration-300 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-6 right-6 game-card-accent ${colorMap[game.color]} rounded-b-full`} />

      <div>
        <GamePreview slug={game.slug} />

        <div className="flex items-center gap-2">
          <h3 className={`text-lg font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
            {game.name}
          </h3>
          {newGameSlugs.has(game.slug) && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-coral to-purple rounded-full px-2 py-0.5">
              New
            </span>
          )}
        </div>
        <p className="text-text-dim text-sm mt-1 leading-relaxed">
          {game.description}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-3">
          <span
            className={`play-btn ${textColorMap[game.color]} ${bgLightMap[game.color]}`}
          >
            Play now
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function ArcadeCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/arcade/${game.slug}`}
      className={`group relative flex flex-col game-card ${gameCardColor[game.color]}
                  p-5 transition-all duration-300 no-underline cursor-pointer`}
    >
      {/* Color accent strip */}
      <div className={`absolute top-0 left-6 right-6 game-card-accent ${colorMap[game.color]} rounded-b-full`} />

      <div>
        <GamePreview slug={game.slug} />

        <h3 className={`text-lg font-bold text-text-primary ${hoverTextMap[game.color]} transition-colors duration-200`}>
          {game.name}
        </h3>
        <p className="text-text-dim text-sm mt-1 leading-relaxed">
          {game.description}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-3">
          <span
            className={`play-btn ${textColorMap[game.color]} ${bgLightMap[game.color]}`}
          >
            {game.creditCost === 0 ? "Free to play" : `${game.creditCost} credits`}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
