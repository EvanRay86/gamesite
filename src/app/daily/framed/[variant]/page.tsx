import { notFound } from "next/navigation";
import FramedGame from "@/components/FramedGame";
import {
  getFramedPuzzleAsync,
  getTodayDate,
  getAvailableVariants,
} from "@/lib/framed-puzzles";

export const revalidate = 60;

export function generateStaticParams() {
  return getAvailableVariants()
    .filter((v) => v !== "all")
    .map((variant) => ({ variant }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  // We need to handle this synchronously for the build
  return {
    title: "Framed — Gamesite",
    description: "Guess the movie one frame at a time.",
  };
}

export default async function FramedVariantPage({
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
  const puzzle = await getFramedPuzzleAsync(today, variant);

  return (
    <main>
      <FramedGame puzzle={puzzle} variant={variant} />
    </main>
  );
}
