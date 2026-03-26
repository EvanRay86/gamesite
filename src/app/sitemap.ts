import type { MetadataRoute } from "next";
import { games } from "@/lib/game-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://gamesite.app";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/daily`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/arcade`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const gamePages: MetadataRoute.Sitemap = games
    .filter((g) => !g.comingSoon)
    .map((game) => ({
      url: `${siteUrl}/${game.category === "daily" ? "daily" : "arcade"}/${game.slug}`,
      lastModified: now,
      changeFrequency: game.category === "daily" ? ("daily" as const) : ("weekly" as const),
      priority: 0.7,
    }));

  const variantPages: MetadataRoute.Sitemap = games
    .filter((g) => !g.comingSoon && g.variants)
    .flatMap((game) =>
      (game.variants ?? [])
        .filter((v) => !v.comingSoon)
        .map((variant) => ({
          url: `${siteUrl}/daily/${game.slug}/${variant.slug}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.6,
        })),
    );

  return [...staticPages, ...gamePages, ...variantPages];
}
