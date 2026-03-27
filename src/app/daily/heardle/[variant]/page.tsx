import Link from "next/link";
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

export function generateMetadata({
  params,
}: {
  params: { variant: string };
}) {
  const label = params.variant
    ? params.variant.charAt(0).toUpperCase() + params.variant.slice(1)
    : "Heardle";
  return {
    title: `Heardle ${label}`,
    description: `Name the ${label.toLowerCase()} song from its opening seconds.`,
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
      <div className="flex justify-center py-6">
        <Link
          href="/daily/heardle/archive"
          className="text-text-muted text-sm hover:text-coral transition-colors no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
    </main>
  );
}
