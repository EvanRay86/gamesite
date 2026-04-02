import type { Metadata } from "next";

const siteUrl = "https://gamesite.app";

/**
 * Build full game-page metadata including canonical URL, OG image, and twitter card.
 */
export function buildGameMetadata(opts: {
  title: string;
  description: string;
  /** e.g. "daily/cluster" or "arcade/snake-arena" */
  path: string;
}): Metadata {
  const url = `${siteUrl}/${opts.path}`;
  const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(opts.title)}&description=${encodeURIComponent(opts.description)}`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Gamesite",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [ogImage],
    },
  };
}

/**
 * Build JSON-LD structured data for a game page.
 */
export function buildGameJsonLd(opts: {
  name: string;
  description: string;
  /** e.g. "daily/cluster" */
  path: string;
  category: "daily" | "arcade";
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: opts.name,
    description: opts.description,
    url: `${siteUrl}/${opts.path}`,
    genre: opts.category === "daily" ? "Puzzle" : "Arcade",
    gamePlatform: "Web Browser",
    applicationCategory: "Game",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "Gamesite",
      url: siteUrl,
    },
  };
}

/**
 * Build JSON-LD structured data for breadcrumbs.
 */
export function buildBreadcrumbJsonLd(
  crumbs: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
