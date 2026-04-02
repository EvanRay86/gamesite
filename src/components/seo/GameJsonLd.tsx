import { buildGameJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";

const siteUrl = "https://gamesite.app";

interface Props {
  name: string;
  description: string;
  /** e.g. "daily/cluster" */
  path: string;
  category: "daily" | "arcade";
}

export default function GameJsonLd({ name, description, path, category }: Props) {
  const gameSchema = buildGameJsonLd({ name, description, path, category });

  const section = category === "daily" ? "Daily Games" : "Arcade";
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl },
    { name: section, url: `${siteUrl}/${category === "daily" ? "daily" : "arcade"}` },
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
