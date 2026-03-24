import { NextRequest, NextResponse } from "next/server";
import { extractFrames, listSessionFrames } from "@/lib/trailer-frames";

export async function POST(req: NextRequest) {
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
    console.error("Frame extraction failed:", err);
    return NextResponse.json(
      { error: "Extraction failed. Check yt-dlp and ffmpeg." },
      { status: 500 },
    );
  }
}
