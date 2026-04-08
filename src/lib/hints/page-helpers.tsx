import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHintsForGame, HINTABLE_GAMES } from "@/lib/hints";
import {
  buildHintPageMetadata,
  buildFAQPageJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { getGameBySlug } from "@/lib/game-registry";
import HintsPageContent from "@/components/HintsPageContent";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const siteUrl = "https://gamesite.app";

/**
 * Redirect handler for /daily/[slug]/hints → /daily/[slug]/hints/YYYY-MM-DD
 */
export function hintsRedirect(slug: string) {
  if (!(HINTABLE_GAMES as readonly string[]).includes(slug)) {
    notFound();
  }
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  redirect(`/daily/${slug}/hints/${yyyy}-${mm}-${dd}`);
}

/**
 * Build metadata for a hints/[date] page.
 */
export function buildHintsMetadata(slug: string, date: string): Metadata {
  if (!DATE_RE.test(date)) return {};
  if (!(HINTABLE_GAMES as readonly string[]).includes(slug)) return {};

  const info = getGameBySlug(slug);
  if (!info) return {};

  return buildHintPageMetadata({
    gameName: info.name,
    gameSlug: slug,
    date,
    color: info.color,
  });
}

/**
 * Validate date and slug before rendering. Call at the page level
 * (default export) so notFound() propagates correctly.
 */
export function validateHintsParams(slug: string, date: string) {
  if (!DATE_RE.test(date)) notFound();
  if (!(HINTABLE_GAMES as readonly string[]).includes(slug)) notFound();

  const puzzleDate = new Date(date + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (puzzleDate > today) notFound();
}

/**
 * Render the hints/[date] page content.
 */
export async function HintsDatePageContent({
  slug,
  date,
}: {
  slug: string;
  date: string;
}) {

  const hintSet = await getHintsForGame(slug, date);
  if (!hintSet) notFound();

  const info = getGameBySlug(slug);
  const categoryLabel = info?.category === "learn" ? "Learn" : "Daily Games";
  const categoryPath = info?.category === "learn" ? "/learn" : "/daily";

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: categoryLabel, url: `${siteUrl}${categoryPath}` },
    { name: hintSet.gameName, url: `${siteUrl}/daily/${slug}` },
    { name: "Hints", url: `${siteUrl}/daily/${slug}/hints/${date}` },
  ]);

  const faqJsonLd = buildFAQPageJsonLd(hintSet.faqs);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HintsPageContent hintSet={hintSet} />
    </main>
  );
}
