import Link from "next/link";
import { getArcadeGames, type Game, type GameColor } from "@/lib/game-registry";

const colorBg: Record<GameColor, string> = {
  coral: "bg-coral", teal: "bg-teal", sky: "bg-sky",
  amber: "bg-amber", purple: "bg-purple", green: "bg-green",
};
const colorText: Record<GameColor, string> = {
  coral: "text-coral", teal: "text-teal", sky: "text-sky",
  amber: "text-amber", purple: "text-purple", green: "text-green",
};
const colorBgLight: Record<GameColor, string> = {
  coral: "bg-coral/10", teal: "bg-teal/10", sky: "bg-sky/10",
  amber: "bg-amber/10", purple: "bg-purple/10", green: "bg-green/10",
};
const borderColor: Record<GameColor, string> = {
  coral: "border-coral/30", teal: "border-teal/30", sky: "border-sky/30",
  amber: "border-amber/30", purple: "border-purple/30", green: "border-green/30",
};
const hoverBorder: Record<GameColor, string> = {
  coral: "hover:border-coral", teal: "hover:border-teal", sky: "hover:border-sky",
  amber: "hover:border-amber", purple: "hover:border-purple", green: "hover:border-green",
};
const hoverBg: Record<GameColor, string> = {
  coral: "hover:bg-coral/5", teal: "hover:bg-teal/5", sky: "hover:bg-sky/5",
  amber: "hover:bg-amber/5", purple: "hover:bg-purple/5", green: "hover:bg-green/5",
};

function GameCard({ game }: { game: Game }) {
  const inner = (
    <div className="relative">
      <div className={`absolute top-0 left-6 right-6 h-1 ${colorBg[game.color]} rounded-b-full`} />

      <div className="p-6 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-text-primary">{game.name}</h2>
          {game.comingSoon && (
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              Coming Soon
            </span>
          )}
        </div>

        <p className="text-sm text-text-dim leading-relaxed">{game.description}</p>

        <div className="flex items-center gap-2 mt-4">
          <span className={`text-xs font-semibold ${colorText[game.color]} ${colorBgLight[game.color]} rounded-full px-3 py-1`}>
            {game.creditCost === 0 ? "Free to play" : `${game.creditCost} credits`}
          </span>
          {!game.comingSoon && (
            <span className={`text-xs font-semibold ${colorText[game.color]} ${colorBgLight[game.color]} rounded-full px-3 py-1`}>
              Play now
            </span>
          )}
        </div>
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
      href={`/arcade/${game.slug}`}
      className={`block bg-white rounded-2xl border-2 ${borderColor[game.color]}
                  ${hoverBorder[game.color]} ${hoverBg[game.color]}
                  shadow-sm hover:shadow-md transition-all duration-200 no-underline`}
    >
      {inner}
    </Link>
  );
}

export default function ArcadePage() {
  const games = getArcadeGames();

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10">
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 mb-8 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary">
          Arcade
        </h1>
        <p className="mt-2 text-text-muted">
          Classic games with a twist. Use credits to play and unlock power-ups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </div>
  );
}
