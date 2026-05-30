import SATACTVocabGame from "@/components/SATACTVocabGame";
import GameJsonLd from "@/components/seo/GameJsonLd";
import { buildGameMetadata } from "@/lib/seo";

export const metadata = buildGameMetadata({
  title: "SAT/ACT Vocab — Free Vocabulary Builder | Gamesite",
  description:
    "Master 650+ high-frequency SAT and ACT vocabulary words through five question types. Track your progress and conquer test-day vocab.",
  path: "learn/sat-act-vocab",
  color: "purple",
});

export default function SATACTVocabLearnPage() {
  return (
    <main>
      <GameJsonLd
        name="SAT/ACT Vocab"
        description="Master 650+ high-frequency SAT and ACT vocabulary words through five question types. Track your progress through every word."
        path="learn/sat-act-vocab"
        category="learn"
      />
      <SATACTVocabGame />
    </main>
  );
}
