import { NextRequest, NextResponse } from "next/server";
import { extractFrames, listSessionFrames } from "@/lib/trailer-frames";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { url, interval } = body as { url: string; interval?: number };

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const { sessionId } = await extractFrames(url, interval || 5);
    const frames = await listSessionFrames(sessionId);

    return NextResponse.json({
      sessionId,
      frames,
      count: frames.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Frame extraction failed:", message, err);
    return NextResponse.json(
      { error: `Extraction failed: ${message}` },
      { status: 500 },
    );
  }
}
