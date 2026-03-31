import PixelVilleGame from "@/components/pixelville/PixelVilleGame";
import MoreCommunityGames from "@/components/MoreCommunityGames";

export const metadata = {
  title: "PixelVille — Community Sim World",
  description:
    "Farm, build, chat, and hang out in a pixel-art community world. Grow crops, decorate your home, and make friends.",
};

export default function PixelVillePage() {
  return (
    <main>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <PixelVilleGame />
      </div>
      <MoreCommunityGames currentSlug="pixelville" />
    </main>
  );
}
