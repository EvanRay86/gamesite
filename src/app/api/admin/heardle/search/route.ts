import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Search SoundCloud for tracks.
 * GET /api/admin/heardle/search?q=bohemian+rhapsody
 *
 * Proxies the SoundCloud API so the client_id stays server-side.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing q param" }, { status: 400 });
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "SOUNDCLOUD_CLIENT_ID not configured" },
      { status: 500 },
    );
  }

  try {
    const url = new URL("https://api-v2.soundcloud.com/search/tracks");
    url.searchParams.set("q", query);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`SoundCloud API returned ${res.status}`);
    }

    const data = await res.json();

    // Map to a simpler shape for the frontend
    const tracks = (data.collection || []).map(
      (t: {
        id: number;
        title: string;
        permalink_url: string;
        artwork_url: string | null;
        duration: number;
        user: { username: string };
        publisher_metadata?: { artist?: string };
        release_year?: number;
      }) => ({
        id: t.id,
        title: t.title,
        url: t.permalink_url,
        artwork: t.artwork_url?.replace("-large", "-t300x300") || null,
        durationMs: t.duration,
        artist: t.publisher_metadata?.artist || t.user.username,
        year: t.release_year || null,
      }),
    );

    return NextResponse.json(tracks);
  } catch (err) {
    console.error("SoundCloud search failed:", err);
    return NextResponse.json(
      { error: "SoundCloud search failed" },
      { status: 500 },
    );
  }
}
