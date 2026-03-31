import Link from "next/link";
import { getArcadeGames, type Game } from "@/lib/game-registry";
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
      <div className={`game-card-accent ${colorBg[game.color]}`} />

      <div className="p-6 pt-5">
        <GamePreview slug={game.slug} />

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

        {!game.comingSoon && (
          <div className="flex items-center gap-2 mt-4">
            <span className={`play-btn ${colorText[game.color]} ${colorBgLight[game.color]}`}>
              {game.creditCost === 0 ? "Free to play" : `${game.creditCost} credits`}
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
      href={`/arcade/${game.slug}`}
      className={`group block game-card ${gameCardColor[game.color]}
                  transition-all duration-300 no-underline`}
    >
      {inner}
    </Link>
  );
}

export default function ArcadePage() {
  const allGames = getArcadeGames();
  const activeGames = allGames.filter((g) => !g.comingSoon);
  const comingSoonGames = allGames.filter((g) => g.comingSoon);
  const games = [...activeGames, ...comingSoonGames];

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      <div className="page-hero p-6 sm:p-8 mb-10">
        <h1 className="font-body text-3xl font-bold text-text-primary">
          Arcade
        </h1>
        <p className="mt-2 text-text-muted leading-relaxed">
          Classic games with a twist. Use credits to play and unlock power-ups.
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
