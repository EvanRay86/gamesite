import Link from "next/link";
import Image from "next/image";
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
            className="text-sm font-semibold text-coral hover:text-coral-dark transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on larger screens */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible sm:pb-0">
          {dailyGames.map((game) => (
            <div key={game.slug} className="min-w-[280px] snap-start sm:min-w-0">
              <DailyCard game={game} />
            </div>
          ))}
        </div>
        {/* Mobile scroll hint */}
        <p className="text-xs text-text-dim text-center mt-2 sm:hidden">Swipe for more →</p>
      </section>

      {/* ── Arcade ───────────────────────────────────────────────────────── */}
      <section id="arcade" className="w-full max-w-[1120px] mb-14 animate-[fade-up_0.5s_ease_0.4s_forwards] opacity-0 relative z-10">
        <div className="section-divider mb-8" />
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-bold text-text-primary">Arcade</h2>
          <Link
            href="/arcade"
            className="text-sm font-semibold text-teal hover:text-teal transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {communityGames.map((game) => (
              <Link
                key={game.slug}
                href={`/arcade/${game.slug}`}
                className="group relative bg-white rounded-xl border border-border-light p-5 shadow-sm
                           hover:shadow-md hover:border-green/40 transition-all duration-200 no-underline"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center text-lg shrink-0">
                    🏘️
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-green transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-text-dim mt-0.5">{game.description}</p>
                    <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-green bg-green/10 px-2 py-0.5 rounded-full">
                      Multiplayer
                    </span>
                  </div>
                </div>
              </Link>
            ))}
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

/* ─── Cluster Mini Preview ───────────────────────────────────────────────── */

const clusterWords = [
  { word: "CASH", selected: false },
  { word: "LOVER", selected: true },
  { word: "TABLE", selected: false },
  { word: "RADIO", selected: false },
  { word: "FOLKLORE", selected: true },
  { word: "HEAT", selected: false },
  { word: "PHOTO", selected: false },
  { word: "MIDNIGHTS", selected: true },
  { word: "LICENSE", selected: false },
  { word: "BURRITO", selected: false },
  { word: "SOUND", selected: false },
  { word: "POKER", selected: false },
  { word: "CLUB", selected: false },
  { word: "BRIDGE", selected: false },
  { word: "RUMMY", selected: false },
];

function ClusterPreview() {
  return (
    <div className="grid grid-cols-5 gap-1.5 mb-4">
      {clusterWords.map(({ word, selected }, i) => (
        <div
          key={i}
          className={`rounded-lg py-2 px-1 text-center text-[9px] sm:text-[11px] font-bold uppercase tracking-wide transition-all
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

/* ─── Hexle Mini Preview ─────────────────────────────────────────────────── */

function HexlePreview() {
  const guesses = [
    { word: "RACING", colors: ["gray", "gray", "gray", "gray", "gray", "green"] },
    { word: "PLAYED", colors: ["gray", "gray", "amber", "green", "green", "gray"] },
    { word: "SCREEN", colors: ["green", "gray", "gray", "green", "green", "green"] },
  ];
  return (
    <div className="mb-4 flex flex-col items-center gap-1">
      {guesses.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.word.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded text-white
                ${row.colors[ci] === "green" ? "bg-green" : row.colors[ci] === "amber" ? "bg-amber" : "bg-gray-400"}`}
            >
              {ch}
            </div>
          ))}
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

/* ─── Crossword Mini Preview ────────────────────────────────────────────── */

function CrosswordPreview() {
  const mini = [
    [0, 0, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0],
  ];
  const letters = [
    ["", "", "N", "E", "W", "S", ""],
    ["", "", "A", "", "", "", ""],
    ["T", "R", "A", "D", "E", "", ""],
    ["", "", "Q", "", "C", "", ""],
    ["", "S", "U", "M", "I", "T", ""],
    ["", "", "", "", "F", "", ""],
  ];
  return (
    <div className="mb-4 flex justify-center">
      <div className="inline-grid gap-[2px] bg-text-primary/20 p-[2px] rounded">
        {mini.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={`flex items-center justify-center text-[8px] sm:text-[9px] font-bold uppercase
                ${cell ? "bg-white text-text-primary" : "bg-transparent"}`}
              style={{
                width: 20,
                height: 20,
                gridRow: ri + 1,
                gridColumn: ci + 1,
              }}
            >
              {cell ? letters[ri][ci] : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── GeoGuess Mini Preview ────────────────────────────────────────────── */

function GeoGuessPreview() {
  return (
    <div className="mb-4 rounded-lg bg-green/5 border border-green/20 p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🇧🇷</span>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green">Hint 1</span>
          <p className="text-xs font-semibold text-text-primary">South America</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="rounded bg-white border border-border-light px-2 py-1 text-[10px] font-medium text-text-secondary flex-1 text-center">Argentina?</div>
        <div className="rounded bg-green text-white px-2 py-1 text-[10px] font-bold flex-1 text-center">Brazil</div>
      </div>
    </div>
  );
}

/* ─── Mathler Mini Preview ─────────────────────────────────────────────── */

function MathlerPreview() {
  const rows = [
    { chars: "15+9*3", colors: ["green", "gray", "yellow", "gray", "green", "green"] },
    { chars: "18-3*2", colors: ["green", "green", "green", "green", "green", "green"] },
  ];
  return (
    <div className="mb-4 flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-purple mb-1">Target: 12</span>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.chars.split("").map((ch, ci) => (
            <div
              key={ci}
              className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded text-white
                ${row.colors[ci] === "green" ? "bg-green" : row.colors[ci] === "yellow" ? "bg-amber" : "bg-gray-400"}`}
            >
              {ch}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Word Ladder Mini Preview ────────────────────────────────────────── */

function WordLadderPreview() {
  const words = ["COLD", "CORD", "CARD", "WARD", "WARM"];
  return (
    <div className="mb-4 flex flex-col items-center gap-1">
      {words.map((word, wi) => (
        <div key={wi} className="flex items-center gap-1">
          {wi > 0 && <span className="text-text-dim text-[8px] absolute -mt-3">↓</span>}
          <div className="flex gap-0.5">
            {word.split("").map((ch, ci) => {
              const prev = wi > 0 ? words[wi - 1] : null;
              const changed = prev && prev[ci] !== ch;
              return (
                <div
                  key={ci}
                  className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded ${
                    wi === 0
                      ? "bg-teal/10 text-teal"
                      : wi === words.length - 1
                        ? "bg-amber/10 text-amber"
                        : changed
                          ? "bg-teal/10 text-teal"
                          : "bg-gray-100 text-text-secondary"
                  }`}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Anagram Mini Preview ────────────────────────────────────────────── */

function AnagramPreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/anagram.jpg" alt="Anagram Scramble - unscramble the words" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

/* ─── Emoji Decoder Mini Preview ─────────────────────────────────────── */

function EmojiDecoderPreview() {
  const rounds = [
    { emojis: "🎸🌟🎤", answer: "ROCKSTAR", solved: true },
    { emojis: "🌊🏄‍♂️☀️", answer: "SURF", solved: true },
    { emojis: "🏰👸🐉", answer: "???", solved: false },
  ];
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2 block">
        Round 3 of 5
      </span>
      <div className="flex flex-col gap-1.5">
        {rounds.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-base leading-none">{r.emojis}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                r.solved
                  ? "bg-green/10 text-green"
                  : "bg-amber/10 text-amber"
              }`}
            >
              {r.answer}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Top 5 Mini Preview ────────────────────────────────────────────── */

function Top5Preview() {
  const items = [
    { rank: 1, label: "China", status: "correct" },
    { rank: 2, label: "India", status: "correct" },
    { rank: 3, label: "USA", status: "wrong" },
    { rank: 4, label: "Indonesia", status: "pending" },
    { rank: 5, label: "Brazil", status: "pending" },
  ];
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber mb-2 block">
        Most Populated Countries
      </span>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.rank} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-dim w-3 text-right">
              {item.rank}
            </span>
            <div
              className={`flex-1 rounded px-2 py-1 text-[10px] font-medium text-center ${
                item.status === "correct"
                  ? "bg-green/10 text-green font-bold"
                  : item.status === "wrong"
                    ? "bg-coral/10 text-coral font-bold"
                    : "bg-gray-100 text-text-secondary"
              }`}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Quotable Mini Preview ─────────────────────────────────────────── */

function QuotablePreview() {
  const words = [
    { text: "Be", revealed: true },
    { text: "the", revealed: true },
    { text: "change", revealed: true },
    { text: "you", revealed: false },
    { text: "wish", revealed: false },
    { text: "to", revealed: true },
    { text: "see", revealed: false },
  ];
  return (
    <div className="mb-4 rounded-lg bg-purple/5 border border-purple/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-purple mb-2 block">
        Who said it?
      </span>
      <div className="flex flex-wrap gap-1 mb-2">
        {words.map((w, i) => (
          <span
            key={i}
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              w.revealed
                ? "text-text-primary"
                : "bg-purple/10 text-purple/40"
            }`}
          >
            {w.revealed ? w.text : "━━━"}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded bg-white border border-border-light px-2 py-1 text-[10px] font-medium text-text-secondary text-center">
          Einstein
        </div>
        <div className="rounded bg-purple text-white px-2 py-1 text-[10px] font-bold text-center">
          Gandhi
        </div>
      </div>
    </div>
  );
}

/* ─── Timeline Mini Preview ─────────────────────────────────────────── */

function TimelinePreview() {
  const events = [
    { year: "1969", label: "Moon Landing", status: "correct" },
    { year: "1989", label: "Berlin Wall Falls", status: "correct" },
    { year: "????", label: "World Wide Web", status: "active" },
    { year: "", label: "First iPhone", status: "pending" },
    { year: "", label: "Mars Rover", status: "pending" },
  ];
  return (
    <div className="mb-4 rounded-lg bg-teal/5 border border-teal/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-teal mb-2 block">
        Put in order
      </span>
      <div className="flex flex-col gap-1">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-text-dim w-7 text-right tabular-nums">
              {e.year}
            </span>
            <div className="flex-1 h-0.5 relative">
              <div
                className={`absolute inset-0 rounded-full ${
                  e.status === "correct"
                    ? "bg-green"
                    : e.status === "active"
                      ? "bg-teal animate-pulse"
                      : "bg-gray-200"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-medium flex-shrink-0 ${
                e.status === "correct"
                  ? "text-green font-bold"
                  : e.status === "active"
                    ? "text-teal font-bold"
                    : "text-text-dim"
              }`}
            >
              {e.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 2048 Mini Preview ────────────────────────────────────────────── */

function Game2048Preview() {
  const tiles = [
    [2, 0, 4, 0],
    [8, 16, 4, 2],
    [32, 64, 8, 4],
    [128, 256, 32, 16],
  ];
  const tileColor: Record<number, string> = {
    0: "bg-stone-200/60",
    2: "bg-stone-100 text-stone-600",
    4: "bg-stone-200 text-stone-600",
    8: "bg-orange-300 text-white",
    16: "bg-orange-400 text-white",
    32: "bg-orange-500 text-white",
    64: "bg-red-400 text-white",
    128: "bg-amber-300 text-white",
    256: "bg-amber-400 text-white",
  };
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
          Score: 1,024
        </span>
        <span className="text-[10px] font-bold text-text-dim">Best: 4,096</span>
      </div>
      <div className="grid grid-cols-4 gap-1 bg-stone-300 rounded-md p-1">
        {tiles.flat().map((v, i) => (
          <div
            key={i}
            className={`${tileColor[v] ?? "bg-purple-500 text-white"} aspect-square flex items-center justify-center rounded text-[9px] font-bold`}
          >
            {v > 0 ? v : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Chain Reaction Mini Preview ────────────────────────────────────── */

function ChainReactionPreview() {
  const chain = [
    { word: "FIRE", status: "solved" },
    { link: "→", status: "solved" },
    { word: "TRUCK", status: "solved" },
    { link: "→", status: "active" },
    { word: "???", status: "pending" },
    { link: "→", status: "pending" },
    { word: "???", status: "pending" },
  ];
  return (
    <div className="mb-4 rounded-lg bg-coral/5 border border-coral/20 p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-coral mb-2 block">
        Complete the chain
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {chain.map((item, i) =>
          "link" in item && item.link ? (
            <span
              key={i}
              className={`text-[10px] font-bold ${
                item.status === "solved" ? "text-green" : item.status === "active" ? "text-coral animate-pulse" : "text-gray-300"
              }`}
            >
              {item.link}
            </span>
          ) : (
            <span
              key={i}
              className={`text-[10px] font-bold px-2 py-1 rounded ${
                item.status === "solved"
                  ? "bg-green/10 text-green"
                  : item.status === "active"
                    ? "bg-coral/10 text-coral border border-coral/30"
                    : "bg-gray-100 text-text-dim"
              }`}
            >
              {item.word}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ─── Wordsmith Mini Preview ────────────────────────────────────────── */

function WordsmithPreview() {
  const tiles = ["F", "O", "R", "G", "E", "D", "S"];
  const powerUps = ["\u{1F525}", "\u26A1", "\u{1F48E}"];
  return (
    <div className="mb-4 rounded-lg bg-amber/5 border border-amber/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber">
          Round 3 of 5
        </span>
        <span className="text-[10px] font-bold text-amber">Score: 247</span>
      </div>
      <div className="flex gap-1 mb-2">
        {tiles.map((letter, i) => (
          <span
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold border ${
              i < 4
                ? "bg-amber/10 border-amber/30 text-amber"
                : "bg-white border-gray-200 text-text-primary"
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {powerUps.map((emoji, i) => (
          <span key={i} className="text-xs bg-amber/10 rounded-full px-1.5 py-0.5">
            {emoji}
          </span>
        ))}
        <span className="text-[9px] text-text-dim ml-auto">Power-ups stack!</span>
      </div>
    </div>
  );
}

/* ─── Meteor Mayhem Mini Preview ─────────────────────────────────────── */

function MeteorPreview() {
  return (
    <div className="mb-4 rounded-lg bg-coral/5 border border-coral/20 p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-coral">Score: 2,450</span>
        <span className="text-[10px] font-bold text-text-dim">Wave 3</span>
      </div>
      <div className="flex justify-center gap-3 py-2">
        <span className="text-3xl" style={{ animation: "meteor-trail 1.5s ease-in-out infinite" }}>☄️</span>
        <span className="text-3xl" style={{ animation: "meteor-trail 1.5s ease-in-out infinite 0.3s" }}>☄️</span>
        <span className="text-2xl" style={{ animation: "float 2s ease-in-out infinite" }}>🚀</span>
        <span className="text-3xl" style={{ animation: "meteor-trail 1.5s ease-in-out infinite 0.6s" }}>☄️</span>
      </div>
      <div className="flex justify-center gap-1 mt-1">
        {[1, 2, 3].map((i) => (
          <span key={i} className="text-[10px] text-coral">❤️</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Big Ah Sword Mini Preview ──────────────────────────────────────── */

function SwordPreview() {
  return (
    <div className="mb-4 rounded-lg bg-coral/5 border border-coral/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-coral">Level 12</span>
        <span className="text-[10px] font-bold text-amber">💰 340 gold</span>
      </div>
      <div className="flex justify-center py-2">
        <span className="text-5xl" style={{ animation: "sword-swing 2s ease-in-out infinite", transformOrigin: "bottom center", display: "inline-block" }}>⚔️</span>
      </div>
      <div className="flex justify-between text-[9px] mt-1">
        <span className="text-text-dim">ATK: <span className="text-coral font-bold">128</span></span>
        <span className="text-text-dim">SIZE: <span className="text-purple font-bold">MEGA</span></span>
        <span className="text-text-dim">SPD: <span className="text-teal font-bold">1.4x</span></span>
      </div>
    </div>
  );
}

/* ─── Sky Hopper Mini Preview ────────────────────────────────────────── */

function SkyHopperPreview() {
  return (
    <div className="mb-4 rounded-lg bg-sky/5 border border-sky/20 p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky">Score: 47</span>
        <span className="text-[10px] font-bold text-amber">Best: 112</span>
      </div>
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="w-4 h-10 bg-green/60 rounded-t-full" />
          <div className="w-4 h-6 bg-green/60 rounded-b-full mt-6" />
        </div>
        <span className="text-3xl" style={{ animation: "bird-flap 0.8s ease-in-out infinite" }}>🐦</span>
        <div className="flex flex-col gap-1">
          <div className="w-4 h-6 bg-green/60 rounded-t-full" />
          <div className="w-4 h-10 bg-green/60 rounded-b-full mt-6" />
        </div>
      </div>
    </div>
  );
}

/* ─── Image-based Previews ────────────────────────────────────────────── */

function HeardlePreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/heardle.jpg" alt="Heardle - guess the song" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function FramedPreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/framed.jpg" alt="Framed - guess the movie" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function SlimePreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/slime-volleyball.jpg" alt="Slime Volleyball" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function KoalaPreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/koala-clicker.jpg" alt="Koala Clicker" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

function SnakePreview() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden">
      <Image src="/images/snake-arena.jpg" alt="Snake Arena" width={688} height={384} className="w-full h-auto" />
    </div>
  );
}

/* ─── Featured Card ─────────────────────────────────────────────────────── */

function FeaturedCard({ game }: { game: Game }) {
  const href = game.category === "daily" ? `/daily/${game.slug}` : `/arcade/${game.slug}`;
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

/* ─── Game Preview Router ───────────────────────────────────────────────── */

function GamePreview({ slug }: { slug: string }) {
  switch (slug) {
    case "cluster": return <ClusterPreview />;
    case "hexle": return <HexlePreview />;
    case "daily-trivia": return <TriviaPreview />;
    case "crossword": return <CrosswordPreview />;
    case "geo-guess": return <GeoGuessPreview />;
    case "mathler": return <MathlerPreview />;
    case "word-ladder": return <WordLadderPreview />;
    case "heardle": return <HeardlePreview />;
    case "framed": return <FramedPreview />;
    case "slime-volleyball": return <SlimePreview />;
    case "koala-clicker": return <KoalaPreview />;
    case "snake-arena": return <SnakePreview />;
    case "2048": return <Game2048Preview />;
    case "anagram": return <AnagramPreview />;
    case "emoji-word": return <EmojiDecoderPreview />;
    case "top-5": return <Top5Preview />;
    case "quotable": return <QuotablePreview />;
    case "timeline": return <TimelinePreview />;
    case "chain-reaction": return <ChainReactionPreview />;
    case "wordsmith": return <WordsmithPreview />;
    case "meteor-mayhem": return <MeteorPreview />;
    case "ginormo-sword": return <SwordPreview />;
    case "sky-hopper": return <SkyHopperPreview />;
    default: return null;
  }
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
