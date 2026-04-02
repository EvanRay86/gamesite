import Link from "next/link";
import { notFound } from "next/navigation";
import FramedGame from "@/components/FramedGame";
import {
  getFramedPuzzleAsync,
  getTodayDate,
  getAvailableVariants,
} from "@/lib/framed-puzzles";
import { buildGameMetadata } from "@/lib/seo";
import GameJsonLd from "@/components/seo/GameJsonLd";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

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
  return buildGameMetadata({
    title: `Framed ${label}`,
    description: `Guess the ${label.toLowerCase()} movie one frame at a time.`,
    path: `daily/framed/${params.variant}`,
  });
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

  const label = variant
    ? variant.charAt(0).toUpperCase() + variant.slice(1)
    : "Framed";

  return (
    <main>
      <GameJsonLd
        name={`Framed ${label}`}
        description={`Guess the ${label.toLowerCase()} movie one frame at a time.`}
        path={`daily/framed/${variant}`}
        category="daily"
      />
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Daily", href: "/daily" },
          { label: "Framed", href: "/daily/framed" },
          { label },
        ]}
      />
      <FramedGame puzzle={puzzle} variant={variant} />
      <div className="flex justify-center py-6">
        <Link
          href="/daily/framed/archive"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-coral-dark hover:shadow-lg active:scale-95 transition-all no-underline"
        >
          Play past puzzles &rarr;
        </Link>
      </div>
    </main>
  );
}
