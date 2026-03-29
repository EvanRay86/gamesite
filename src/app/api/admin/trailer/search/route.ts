import { NextRequest, NextResponse } from "next/server";
import { searchTrailers } from "@/lib/trailer-frames";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing ?q= parameter" }, { status: 400 });
  }

  try {
    const results = await searchTrailers(q);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Trailer search failed:", message, err);
    return NextResponse.json(
      { error: `Search failed: ${message}` },
      { status: 500 },
    );
  }
}
