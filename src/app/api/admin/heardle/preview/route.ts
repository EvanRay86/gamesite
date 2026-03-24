import { NextRequest, NextResponse } from "next/server";
import { readSessionAudio } from "@/lib/heardle-audio";

/**
 * Serve an audio file from a temp session.
 * GET /api/admin/heardle/preview?session=xxx&file=full.mp3
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session");
  const file = req.nextUrl.searchParams.get("file") || "full.mp3";

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session param" },
      { status: 400 },
    );
  }

  // Prevent path traversal
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const buffer = await readSessionAudio(sessionId, file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }
}
