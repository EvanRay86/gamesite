import { NextRequest, NextResponse } from "next/server";
import { extractAudio } from "@/lib/heardle-audio";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url } = body as { url: string };

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const { sessionId, durationSeconds } = await extractAudio(url);

    return NextResponse.json({
      sessionId,
      durationSeconds,
    });
  } catch (err) {
    console.error("Audio extraction failed:", err);
    return NextResponse.json(
      { error: "Audio extraction failed. Check yt-dlp and ffmpeg." },
      { status: 500 },
    );
  }
}
