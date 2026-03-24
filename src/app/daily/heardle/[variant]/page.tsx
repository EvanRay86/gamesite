import { notFound } from "next/navigation";
import HeardleGame from "@/components/HeardleGame";
import {
  getHeardlePuzzleAsync,
  getTodayDate,
  getAvailableVariants,
} from "@/lib/heardle-puzzles";

export const revalidate = 60;

export function generateStaticParams() {
  return getAvailableVariants()
    .filter((v) => v !== "all")
    .map((variant) => ({ variant }));
}

export function generateMetadata() {
  return {
    title: "Heardle — Gamesite",
    description: "Name the song from its opening seconds.",
  };
}

export default async function HeardleVariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  const available = getAvailableVariants();

  if (!available.includes(variant)) {
    notFound();
  }

  const today = getTodayDate();
  const puzzle = await getHeardlePuzzleAsync(today, variant);

  return (
    <main>
      <HeardleGame puzzle={puzzle} variant={variant} />
    </main>
  );
}
