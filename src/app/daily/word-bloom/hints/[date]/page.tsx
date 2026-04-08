import type { Metadata } from "next";
import { buildHintsMetadata, HintsDatePageContent, validateHintsParams } from "@/lib/hints/page-helpers";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return buildHintsMetadata("word-bloom", date);
}

export default async function HintsDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  validateHintsParams("word-bloom", date);
  return <HintsDatePageContent slug="word-bloom" date={date} />;
}
