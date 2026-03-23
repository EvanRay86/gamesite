import SlimeVolleyball from "@/components/SlimeVolleyball";
import Link from "next/link";

export const metadata = {
  title: "Slime Volleyball — Online Multiplayer",
  description: "Play Slime Volleyball against friends or random opponents online.",
};

export default function SlimePage() {
  return (
    <main>
      <SlimeVolleyball />
      <div className="fixed bottom-4 right-4">
        <Link
          href="/"
          className="bg-surface text-text-muted border border-border-light
                     rounded-full px-4 py-2 text-xs font-semibold
                     hover:bg-surface-hover hover:text-text-secondary transition-all
                     no-underline"
        >
          More Games
        </Link>
      </div>
    </main>
  );
}
