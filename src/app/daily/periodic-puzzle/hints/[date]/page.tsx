import type { Metadata } from "next";
import { buildHintsMetadata, HintsDatePageContent, validateHintsParams } from "@/lib/hints/page-helpers";
export const revalidate = 3600;
export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> { const { date } = await params; return buildHintsMetadata("periodic-puzzle", date); }
export default async function HintsDatePage({ params }: { params: Promise<{ date: string }> }) { const { date } = await params; validateHintsParams("periodic-puzzle", date); return <HintsDatePageContent slug="periodic-puzzle" date={date} />; }
