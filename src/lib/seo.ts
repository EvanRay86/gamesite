import type { Metadata } from "next";
import type { FAQ } from "@/types/hints";

const siteUrl = "https://gamesite.app";

/**
 * Build full game-page metadata including canonical URL, OG image, and twitter card.
 */
export function buildGameMetadata(opts: {
  title: string;
  description: string;
  /** e.g. "daily/cluster" or "arcade/snake-arena" */
  path: string;
  /** Game color token for OG image accent. Defaults to "coral". */
  color?: string;
}): Metadata {
  const url = `${siteUrl}/${opts.path}`;
  const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(opts.title)}&color=${encodeURIComponent(opts.color ?? "coral")}`;

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
      site: "@GamesiteAppEvan",
      creator: "@GamesiteAppEvan",
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
  category: "daily" | "arcade" | "learn";
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

/**
 * Build metadata for a daily-game hints page.
 */
export function buildHintPageMetadata(opts: {
  gameName: string;
  gameSlug: string;
  date: string;
  color?: string;
}): Metadata {
  const d = new Date(opts.date + "T00:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const title = `${opts.gameName} Hints Today — ${formatted}`;
  const description = `Need help with today's ${opts.gameName}? Get progressive hints (mild, medium, strong) for the ${formatted} puzzle without spoilers. Free daily hints on Gamesite.`;
  const path = `daily/${opts.gameSlug}/hints/${opts.date}`;

  return buildGameMetadata({ title, description, path, color: opts.color });
}

/**
 * Build FAQPage JSON-LD structured data.
 */
export function buildFAQPageJsonLd(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Build metadata for a blog article page.
 */
export function buildArticleMetadata(opts: {
  title: string;
  description: string;
  slug: string;
  image?: string;
}): Metadata {
  const url = `${siteUrl}/blog/${opts.slug}`;
  const ogImage =
    opts.image ??
    `${siteUrl}/api/og?title=${encodeURIComponent(opts.title)}&color=${encodeURIComponent("teal")}`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Gamesite",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@GamesiteAppEvan",
      creator: "@GamesiteAppEvan",
      title: opts.title,
      description: opts.description,
      images: [ogImage],
    },
  };
}

/**
 * Build Article JSON-LD structured data for a blog post.
 */
export function buildArticleJsonLd(opts: {
  title: string;
  description: string;
  slug: string;
  author: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}) {
  const ogImage =
    opts.image ??
    `${siteUrl}/api/og?title=${encodeURIComponent(opts.title)}&color=${encodeURIComponent("teal")}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: `${siteUrl}/blog/${opts.slug}`,
    image: ogImage,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      "@type": "Person",
      name: opts.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Gamesite",
      url: siteUrl,
    },
  };
}
