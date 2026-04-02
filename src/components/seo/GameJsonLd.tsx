import { buildGameJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";

const siteUrl = "https://gamesite.app";

interface Props {
  name: string;
  description: string;
  /** e.g. "daily/cluster" */
  path: string;
  category: "daily" | "arcade" | "learn";
}

const sectionMap: Record<string, { label: string; slug: string }> = {
  daily: { label: "Daily Games", slug: "daily" },
  arcade: { label: "Arcade", slug: "arcade" },
  learn: { label: "Learn", slug: "learn" },
};

export default function GameJsonLd({ name, description, path, category }: Props) {
  const gameSchema = buildGameJsonLd({ name, description, path, category });

  const { label: section, slug } = sectionMap[category];
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: section, url: `${siteUrl}/${slug}` },
    { name, url: `${siteUrl}/${path}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  );
}
