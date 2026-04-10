import type { Metadata } from "next";
import Link from "next/link";
import { getLearnGames, type Game } from "@/lib/game-registry";
import {
  colorBg,
  colorText,
  colorBgLight,
  borderColor,
  hoverBorder,
  hoverBg,
} from "@/lib/color-maps";
import GamePreview from "@/components/GamePreview";

export const metadata: Metadata = {
  title: "Free Learning Games — Math Puzzles, Geography & History Trivia | Gamesite",
  description:
    "Learn geography, math, history, and famous quotes through interactive daily games. Track your progress and master every challenge.",
  alternates: { canonical: "https://gamesite.app/learn" },
};

function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/learn/${game.slug}`}
      className={`block bg-white rounded-2xl border-2 ${borderColor[game.color]}
                  ${hoverBorder[game.color]} ${hoverBg[game.color]}
                  shadow-sm hover:shadow-md transition-all duration-200 no-underline`}
    >
      <div className="relative">
        <div className={`absolute top-0 left-6 right-6 h-1 ${colorBg[game.color]} rounded-b-full`} />
        <div className="p-6 pt-5">
          <GamePreview slug={game.slug} />
          <h2 className="text-xl font-bold text-text-primary mb-1">{game.name}</h2>
          <p className="text-sm text-text-dim leading-relaxed">{game.description}</p>
          <div className="flex items-center gap-2 mt-4">
            <span className={`text-xs font-semibold ${colorText[game.color]} ${colorBgLight[game.color]} rounded-full px-3 py-1`}>
              Start learning
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LearnPage() {
  const games = getLearnGames();

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-8 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary">
          Learn
        </h1>
        <p className="mt-2 text-text-muted">
          Sharpen your mind with math, history, quotes, and world knowledge. Track your progress as you learn.
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
