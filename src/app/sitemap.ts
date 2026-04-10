import type { MetadataRoute } from "next";
import { games } from "@/lib/game-registry";
import { HINTABLE_GAMES } from "@/lib/hints";

/** Games with high organic search volume get boosted sitemap priority. */
const HIGH_PRIORITY_SLUGS = new Set([
  "crossword",
  "daily-trivia",
  "2048",
  "cluster",
  "hexle",
  "mathler",
  "word-bloom",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://gamesite.app";
  const today = new Date();
  // Start of today (midnight) for daily-changing content
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: todayStart, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/daily`, lastModified: todayStart, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/arcade`, lastModified: todayStart, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/learn`, lastModified: todayStart, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified: new Date("2025-01-01"), changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, lastModified: new Date("2025-01-01"), changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: new Date("2025-01-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: new Date("2025-01-01"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const gamePages: MetadataRoute.Sitemap = games
    .filter((g) => !g.comingSoon && !g.hidden)
    .map((game) => ({
      url: `${siteUrl}/${game.category === "daily" ? "daily" : game.category === "learn" ? "learn" : "arcade"}/${game.slug}`,
      lastModified: game.category === "daily" ? todayStart : todayStart,
      changeFrequency: game.category === "daily" ? ("daily" as const) : ("weekly" as const),
      priority: HIGH_PRIORITY_SLUGS.has(game.slug) ? 0.9 : 0.7,
    }));

  const variantPages: MetadataRoute.Sitemap = games
    .filter((g) => !g.comingSoon && !g.hidden && g.variants)
    .flatMap((game) =>
      (game.variants ?? [])
        .filter((v) => !v.comingSoon)
        .map((variant) => ({
          url: `${siteUrl}/daily/${game.slug}/${variant.slug}`,
          lastModified: todayStart,
          changeFrequency: "daily" as const,
          priority: HIGH_PRIORITY_SLUGS.has(game.slug) ? 0.8 : 0.6,
        })),
    );

  // Daily hint pages — one per hintable game, targeting today's date
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const hintPages: MetadataRoute.Sitemap = HINTABLE_GAMES.map((slug) => ({
    url: `${siteUrl}/daily/${slug}/hints/${todayStr}`,
    lastModified: todayStart,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...gamePages, ...variantPages, ...hintPages];
}
