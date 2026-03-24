import { NextRequest, NextResponse } from "next/server";
import { trimAudioClip } from "@/lib/heardle-audio";

/**
 * Trim the full audio to a clip starting at a given time.
 * POST /api/admin/heardle/trim
 * Body: { sessionId, startSeconds, clipDuration? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, startSeconds, clipDuration } = body as {
    sessionId: string;
    startSeconds: number;
    clipDuration?: number;
  };

  if (!sessionId || startSeconds === undefined) {
    return NextResponse.json(
      { error: "Missing sessionId or startSeconds" },
      { status: 400 },
    );
  }

  try {
    await trimAudioClip(sessionId, startSeconds, clipDuration || 16);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Trim failed:", err);
    return NextResponse.json(
      { error: "Failed to trim audio clip" },
      { status: 500 },
    );
  }
}
