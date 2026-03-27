import Link from "next/link";
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
  params: { variant: string };
}) {
  const label = params.variant
    ? params.variant.charAt(0).toUpperCase() + params.variant.slice(1)
    : "Framed";
  return {
    title: `Framed ${label}`,
    description: `Guess the ${label.toLowerCase()} movie one frame at a time.`,
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
      <div className="flex justify-center py-6">
        <Link
          href="/daily/framed/archive"
          className="text-text-muted text-sm hover:text-coral transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
    </main>
  );
}
