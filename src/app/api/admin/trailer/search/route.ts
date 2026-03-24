import { NextRequest, NextResponse } from "next/server";
import { searchTrailers } from "@/lib/trailer-frames";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing ?q= parameter" }, { status: 400 });
  }

  try {
    const results = await searchTrailers(q);
    return NextResponse.json(results);
  } catch (err) {
    console.error("Trailer search failed:", err);
    return NextResponse.json(
      { error: "Search failed. Is yt-dlp installed?" },
      { status: 500 },
    );
  }
}
