import { NextRequest, NextResponse } from "next/server";
import { readFrameImage } from "@/lib/trailer-frames";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Serve a frame image from a temp session.
 * GET /api/admin/trailer/frame?session=xxx&file=frame-001.jpg
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const sessionId = req.nextUrl.searchParams.get("session");
  const file = req.nextUrl.searchParams.get("file");

  if (!sessionId || !file) {
    return NextResponse.json(
      { error: "Missing session or file param" },
      { status: 400 },
    );
  }

  // Prevent path traversal
  if (file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const buffer = await readFrameImage(sessionId, file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }
}
