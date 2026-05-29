import type { Metadata } from "next";
import OutrankGame from "@/components/OutrankGame";
import MoreArcadeGames from "@/components/MoreArcadeGames";
import { getOutrankPool, getChallenge } from "@/lib/outrank-data";

export const revalidate = 300;

const siteUrl = "https://gamesite.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getChallenge(id);

  if (!challenge) {
    return {
      title: "Outrank Challenge — Which Is More?",
      description:
        "Play Outrank — the addictive which-is-more streak game. Build your streak and challenge a friend.",
      alternates: { canonical: `${siteUrl}/arcade/outrank/d/${id}` },
    };
  }

  const title = `${challenge.challengerName} scored ${challenge.challengerScore} on Outrank — can you beat it?`;
  const description = `${challenge.challengerName} built a streak of ${challenge.challengerScore}. Take the exact same challenge and try to outrank them. Free, no download.`;
  const url = `${siteUrl}/arcade/outrank/d/${id}`;
  const ogImage = `${siteUrl}/api/outrank/og?name=${encodeURIComponent(
    challenge.challengerName,
  )}&score=${challenge.challengerScore}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Gamesite",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@GamesiteAppEvan",
      creator: "@GamesiteAppEvan",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function OutrankChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pool, challenge] = await Promise.all([
    getOutrankPool(),
    getChallenge(id),
  ]);

  return (
    <main>
      <OutrankGame
        mode={challenge ? "challenge" : "solo"}
        pool={pool}
        challenge={challenge}
      />
      <MoreArcadeGames currentSlug="outrank" />
    </main>
  );
}
