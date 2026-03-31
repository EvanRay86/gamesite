import Link from "next/link";
import { getDailyGames, type Game } from "@/lib/game-registry";
import {
  colorBg,
  colorText,
  colorBgLight,
  gameCardColor,
  hoverText,
} from "@/lib/color-maps";
import GamePreview from "@/components/GamePreview";

function GameCard({ game }: { game: Game }) {
  const inner = (
    <div className="relative">
      {/* Accent strip */}
      <div className={`game-card-accent ${colorBg[game.color]}`} />

      <div className="p-6 pt-5 relative z-10">
        <div className="preview-container">
          <GamePreview slug={game.slug} />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h2 className={`text-xl font-bold text-text-primary ${hoverText[game.color]} transition-colors duration-200`}>
            {game.name}
          </h2>
          {game.comingSoon && (
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              Coming Soon
            </span>
          )}
        </div>

        <p className="text-sm text-text-dim leading-relaxed">{game.description}</p>

        {game.variants && game.variants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {game.variants.map((v) => (
              <span
                key={v.slug}
                className={`variant-pill rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  v.comingSoon
                    ? "bg-surface text-text-dim border border-dashed border-border-light"
                    : `${colorBgLight[game.color]} ${colorText[game.color]}`
                }`}
              >
                {v.name}
              </span>
            ))}
          </div>
        )}

        {!game.comingSoon && (
          <div className="mt-4">
            <span className={`play-btn ${colorText[game.color]} ${colorBgLight[game.color]}`}>
              Play now
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (game.comingSoon) {
    return (
      <div className="game-card opacity-50">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/daily/${game.slug}`}
      className={`group block game-card ${gameCardColor[game.color]}
                  transition-all duration-300 no-underline`}
    >
      {inner}
    </Link>
  );
}

export default function DailyPage() {
  const allGames = getDailyGames();
  const activeGames = allGames.filter((g) => !g.comingSoon);
  const comingSoonGames = allGames.filter((g) => g.comingSoon);
  const games = [...activeGames, ...comingSoonGames];

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      <div className="page-hero p-6 sm:p-8 mb-10">
        <h1 className="font-body text-3xl font-bold text-text-primary">
          Daily Puzzles
        </h1>
        <p className="mt-2 text-text-muted leading-relaxed">
          A fresh challenge every day. Free to play today — subscribe to unlock
          the archive.
        </p>
      </div>

      <div className="masonry-cards">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </div>
  );
}
