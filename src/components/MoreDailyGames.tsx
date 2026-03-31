import Link from "next/link";
import { getDailyGames, type Game } from "@/lib/game-registry";
import {
  colorBg,
  colorText,
  colorBgLight,
  borderColor,
  hoverBorder,
  hoverBg,
} from "@/lib/color-maps";
import GamePreview from "@/components/GamePreview";

function MiniCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/daily/${game.slug}`}
      className={`group relative flex flex-col bg-white rounded-2xl border-2 ${borderColor[game.color]}
                  ${hoverBorder[game.color]} ${hoverBg[game.color]}
                  shadow-sm hover:shadow-md transition-all duration-200 no-underline`}
    >
      <div className={`h-1 rounded-t-xl ${colorBg[game.color]}`} />
      <div className="p-4">
        <GamePreview slug={game.slug} />
        <h3 className="text-sm font-bold text-text-primary">{game.name}</h3>
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
      <div className="border-t border-border-light pt-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">More Daily Games</h2>
          <Link
            href="/daily"
            className="text-sm font-semibold text-teal hover:text-teal transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherGames.map((game) => (
            <MiniCard key={game.slug} game={game} />
          ))}
        </div>
      </div>
    </section>
  );
}
