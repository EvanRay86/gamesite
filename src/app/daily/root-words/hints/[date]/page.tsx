import type { Metadata } from "next";
import { buildHintsMetadata, HintsDatePageContent, validateHintsParams } from "@/lib/hints/page-helpers";
export const revalidate = 3600;
export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> { const { date } = await params; return buildHintsMetadata("root-words", date); }
export default async function HintsDatePage({ params }: { params: Promise<{ date: string }> }) { const { date } = await params; validateHintsParams("root-words", date); return <HintsDatePageContent slug="root-words" date={date} />; }
