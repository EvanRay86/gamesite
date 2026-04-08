import type { Metadata } from "next";
import { buildHintsMetadata, HintsDatePageContent, validateHintsParams } from "@/lib/hints/page-helpers";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return buildHintsMetadata("hexle", date);
}

export default async function HintsDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  validateHintsParams("hexle", date);
  return <HintsDatePageContent slug="hexle" date={date} />;
}
