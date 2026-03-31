import Link from "next/link";
import { getCommunityGames, getArcadeGames, type Game } from "@/lib/game-registry";
import {
  colorBg,
  colorText,
  colorBgLight,
  borderColor,
  hoverBorder,
  hoverBg,
} from "@/lib/color-maps";
import GamePreview from "@/components/GamePreview";

function MiniCard({ game, href }: { game: Game; href: string }) {
  return (
    <Link
      href={href}
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
        <span
          className={`inline-block mt-2 text-[10px] font-semibold ${colorText[game.color]} ${colorBgLight[game.color]} rounded-full px-2.5 py-0.5`}
        >
          {game.creditCost === 0 ? "Free to play" : `${game.creditCost} credits`}
        </span>
      </div>
    </Link>
  );
}

function getHref(game: Game): string {
  if (game.category === "community") {
    if (game.slug === "pixelville") return "/arcade/pixelville";
    if (game.slug === "rift") return "/rift";
  }
  return `/arcade/${game.slug}`;
}

export default function MoreCommunityGames({ currentSlug }: { currentSlug: string }) {
  // Show other community games + some arcade games to fill the grid
  const communityGames = getCommunityGames().filter(
    (g) => g.slug !== currentSlug && !g.comingSoon,
  );
  const arcadeGames = getArcadeGames().filter((g) => !g.comingSoon);
  const allGames = [...communityGames, ...arcadeGames].slice(0, 8);

  if (allGames.length === 0) return null;

  return (
    <section className="w-full max-w-[960px] mx-auto px-4 pb-10 pt-2">
      <div className="border-t border-border-light pt-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">More Games</h2>
          <Link
            href="/arcade"
            className="text-sm font-semibold text-teal hover:text-teal transition-colors no-underline"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="masonry-cards-more">
          {allGames.map((game) => (
            <MiniCard key={game.slug} game={game} href={getHref(game)} />
          ))}
        </div>
      </div>
    </section>
  );
}
