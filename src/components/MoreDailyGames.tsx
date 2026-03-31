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

function MiniCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/daily/${game.slug}`}
      className={`group relative flex flex-col game-card ${gameCardColor[game.color]}
                  transition-all duration-300 no-underline`}
    >
      <div className={`game-card-accent ${colorBg[game.color]}`} />
      <div className="p-4 relative z-10">
        <div className="preview-container">
          <GamePreview slug={game.slug} />
        </div>
        <h3 className={`text-sm font-bold text-text-primary ${hoverText[game.color]} transition-colors duration-200`}>
          {game.name}
        </h3>
        <p className="text-text-dim text-xs mt-0.5 leading-relaxed line-clamp-2">
          {game.description}
        </p>
      </div>
    </Link>
  );
}

export default function MoreDailyGames({ currentSlug }: { currentSlug: string }) {
  const otherGames = getDailyGames().filter(
    (g) => g.slug !== currentSlug && !g.comingSoon,
  );

  if (otherGames.length === 0) return null;

  return (
    <section className="w-full max-w-[960px] mx-auto px-4 pb-10 pt-2">
      <div className="pt-8">
        <div className="page-header-bar w-12 mb-5" />
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">More Daily Games</h2>
          <Link
            href="/daily"
            className="text-sm font-semibold text-teal hover:text-teal transition-colors no-underline flex items-center gap-1"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="masonry-cards-more">
          {otherGames.map((game) => (
            <MiniCard key={game.slug} game={game} />
          ))}
        </div>
      </div>
    </section>
  );
}
