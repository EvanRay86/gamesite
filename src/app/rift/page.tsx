import RiftGame from "@/components/RiftGame";
import MoreCommunityGames from "@/components/MoreCommunityGames";

export const metadata = {
  title: "RIFT — Conquer the Map Through Brain Power",
  description:
    "Join a faction, battle for territory through puzzle duels, and dominate the hex grid. Real-time multiplayer strategy meets brain teasers.",
};

export default function RiftPage() {
  return (
    <main>
      <RiftGame />
      <MoreCommunityGames currentSlug="rift" />
    </main>
  );
}
