import type { Metadata } from "next";
import Link from "next/link";
import { getDailyGames, type Game } from "@/lib/game-registry";

export const metadata: Metadata = {
  title: "Daily Puzzle Games — Free Word Games, Trivia & Crossword | Gamesite",
  description:
    "14 free daily puzzle games updated every day. Crosswords, word ladders, trivia, anagram scrambles, emoji puzzles, and more. Play instantly in your browser.",
  alternates: { canonical: "https://gamesite.app/daily" },
};
import {
  colorBg,
  colorText,
  colorBgLight,
  borderColor,
  hoverBorder,
  hoverBg,
} from "@/lib/color-maps";
import GamePreview from "@/components/GamePreview";

function GameCard({ game }: { game: Game }) {
  const inner = (
    <div className="relative">
      {/* Accent strip */}
      <div className={`absolute top-0 left-6 right-6 h-1 ${colorBg[game.color]} rounded-b-full`} />

      <div className="p-6 pt-5">
        <GamePreview slug={game.slug} />

        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-text-primary">{game.name}</h2>
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
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
            <span className={`text-xs font-semibold ${colorText[game.color]} ${colorBgLight[game.color]} rounded-full px-3 py-1`}>
              Play now
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (game.comingSoon) {
    return (
      <div className="bg-white rounded-2xl border-2 border-border-light opacity-50 shadow-sm">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/daily/${game.slug}`}
      className={`block bg-white rounded-2xl border-2 ${borderColor[game.color]}
                  ${hoverBorder[game.color]} ${hoverBg[game.color]}
                  shadow-sm hover:shadow-md transition-all duration-200 no-underline`}
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
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-8 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary">
          Daily Puzzles
        </h1>
        <p className="mt-2 text-text-muted">
          A fresh challenge every day. Play today or explore the full archive.
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
