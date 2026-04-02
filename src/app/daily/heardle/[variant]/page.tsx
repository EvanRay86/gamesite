import Link from "next/link";
import { notFound } from "next/navigation";
import HeardleGame from "@/components/HeardleGame";
import {
  getHeardlePuzzleAsync,
  getTodayDate,
  getAvailableVariants,
} from "@/lib/heardle-puzzles";
import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";

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
  return buildGameMetadata({
    title: `Heardle ${label}`,
    description: `Name the ${label.toLowerCase()} song from its opening seconds.`,
    path: `daily/heardle/${params.variant}`,
  });
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

  const label = variant
    ? variant.charAt(0).toUpperCase() + variant.slice(1)
    : "Heardle";

  return (
    <main>
      <GameJsonLd
        name={`Heardle ${label}`}
        description={`Name the ${label.toLowerCase()} song from its opening seconds.`}
        path={`daily/heardle/${variant}`}
        category="daily"
      />
      <HeardleGame puzzle={puzzle} variant={variant} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/heardle/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
    </main>
  );
}
