import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import WaveRider from "@/components/WaveRider";
import MoreArcadeGames from "@/components/MoreArcadeGames";

export const metadata = buildGameMetadata({
  title: "Wave Rider — Surf the Music",
  description:
    "Upload a song or paste a SoundCloud link. Ride the waveform, dodge obstacles, and collect orbs in this music-powered arcade game.",
  path: "arcade/wave-rider",
  color: "purple",
});

export default function WaveRiderPage() {
  return (
    <main>
      <GameJsonLd
        name="Wave Rider"
        description="Upload a song or paste a SoundCloud link. Ride the waveform, dodge obstacles, and collect orbs."
        path="arcade/wave-rider"
        category="arcade"
      />
      <WaveRider />
      <MoreArcadeGames currentSlug="wave-rider" />
    </main>
  );
}
