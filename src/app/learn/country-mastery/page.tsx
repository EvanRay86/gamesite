import GeoGuessGame from "@/components/GeoGuessGame";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const metadata = buildGameMetadata({
  title: "Country Mastery",
  description:
    "Learn every country from progressive hints: outline, population, flag, capital, and fun facts. Track your mastery of all 195 countries.",
  path: "learn/country-mastery",
});

export default function CountryMasteryLearnPage() {
  return (
    <main>
      <GameJsonLd name="Country Mastery" description="Learn every country from progressive hints: outline, population, flag, capital, and fun facts. Track your mastery of all 195 countries." path="learn/country-mastery" category="learn" />
      <GeoGuessGame />
    </main>
  );
}
