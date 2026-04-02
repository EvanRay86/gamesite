import GeoGuessGame from "@/components/GeoGuessGame";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const metadata = buildGameMetadata({
  title: "Where in the World",
  description:
    "Learn every country from progressive hints: outline, population, flag, capital, and fun facts. Track your mastery of all 195 countries.",
  path: "learn/geo-guess",
});

export default function GeoGuessLearnPage() {
  return (
    <main>
      <GameJsonLd name="Where in the World" description="Learn every country from progressive hints: outline, population, flag, capital, and fun facts. Track your mastery of all 195 countries." path="learn/geo-guess" category="learn" />
      <GeoGuessGame />
    </main>
  );
}
