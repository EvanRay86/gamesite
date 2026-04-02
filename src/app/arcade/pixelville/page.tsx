import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PixelVilleGame from "@/components/pixelville/PixelVilleGame";
import MoreCommunityGames from "@/components/MoreCommunityGames";

export const metadata = buildGameMetadata({
  title: "PixelVille",
  description:
    "Farm, build, chat, and hang out in a pixel-art community world.",
  path: "arcade/pixelville",
});

export default function PixelVillePage() {
  return (
    <main>
      <GameJsonLd name="PixelVille" description="Farm, build, chat, and hang out in a pixel-art community world." path="arcade/pixelville" category="arcade" />
      <Breadcrumbs crumbs={[
        { label: "Home", href: "/" },
        { label: "Arcade", href: "/arcade" },
        { label: "PixelVille" },
      ]} />
      <div className="fixed inset-0 z-50 overflow-hidden">
        <PixelVilleGame />
      </div>
      <MoreCommunityGames currentSlug="pixelville" />
    </main>
  );
}
