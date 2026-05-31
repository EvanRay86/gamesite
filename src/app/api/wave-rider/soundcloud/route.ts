// ── Wave Rider · SoundCloud resolve proxy ────────────────────────────────────
// SoundCloud's public endpoints (oEmbed, api-v2, waveform JSON) don't send CORS
// headers, so the browser can't read them directly. This route runs server-side
// (no CORS) to resolve a track URL into its title, duration, and REAL waveform
// samples. The client then plays the track via the SoundCloud widget and surfs
// the actual waveform we return here.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// SoundCloud rotates its public web client_id periodically. We scrape one from
// the homepage JS bundles and cache it in module scope (survives across requests
// on a warm server instance), refreshing automatically when a call gets a 401/403.
let cachedClientId: string | null = null;

// Tiny in-memory cache of resolved tracks so replays / repeated links are instant.
const trackCache = new Map<string, ResolvedTrack>();
const TRACK_CACHE_MAX = 50;

interface ResolvedTrack {
  title: string;
  durationMs: number;
  samples: number[];
  height: number;
  artwork: string | null;
}

async function scrapeClientId(): Promise<string | null> {
  const home = await fetch("https://soundcloud.com/", {
    headers: { "User-Agent": UA },
  });
  if (!home.ok) return null;
  const html = await home.text();
  const scriptUrls = [
    ...html.matchAll(/<script[^>]+src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g),
  ].map((m) => m[1]);

  // The client_id usually lives in one of the later bundles, so search from the end.
  for (const src of scriptUrls.reverse()) {
    try {
      const js = await (await fetch(src, { headers: { "User-Agent": UA } })).text();
      const m = js.match(/client_id\s*[:=]\s*"([a-zA-Z0-9]{20,})"/);
      if (m) return m[1];
    } catch {
      // try the next bundle
    }
  }
  return null;
}

async function getClientId(forceRefresh = false): Promise<string | null> {
  if (cachedClientId && !forceRefresh) return cachedClientId;
  cachedClientId = await scrapeClientId();
  return cachedClientId;
}

/** Resolve a SoundCloud track URL, retrying once with a fresh client_id on auth failure. */
async function resolveTrack(url: string): Promise<
  | { ok: true; track: ResolvedTrack }
  | { ok: false; status: number; error: string }
> {
  const cached = trackCache.get(url);
  if (cached) return { ok: true, track: cached };

  for (let attempt = 0; attempt < 2; attempt++) {
    const clientId = await getClientId(attempt === 1);
    if (!clientId) {
      return { ok: false, status: 502, error: "Couldn't reach SoundCloud right now. Try again." };
    }

    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`;
    const resp = await fetch(resolveUrl, { headers: { "User-Agent": UA } });

    // Stale client_id → refresh and retry once.
    if ((resp.status === 401 || resp.status === 403) && attempt === 0) continue;

    if (resp.status === 404) {
      return { ok: false, status: 404, error: "That SoundCloud track couldn't be found." };
    }
    if (!resp.ok) {
      return { ok: false, status: 502, error: "SoundCloud wouldn't load that track." };
    }

    const data: unknown = await resp.json();
    const track = data as {
      kind?: string;
      title?: string;
      duration?: number;
      waveform_url?: string;
      artwork_url?: string | null;
      streamable?: boolean;
    };

    if (track.kind !== "track") {
      return { ok: false, status: 400, error: "Please paste a link to a single SoundCloud track (not a playlist or profile)." };
    }
    if (!track.waveform_url || !track.duration) {
      return { ok: false, status: 502, error: "This track is missing waveform data." };
    }

    // Waveform JSON: { width, height, samples: number[] } — the real peak envelope.
    let waveform: { samples?: number[]; height?: number };
    try {
      const wfUrl = track.waveform_url.replace(/^http:/, "https:");
      waveform = await (await fetch(wfUrl, { headers: { "User-Agent": UA } })).json();
    } catch {
      return { ok: false, status: 502, error: "Couldn't read this track's waveform." };
    }
    if (!Array.isArray(waveform.samples) || waveform.samples.length === 0) {
      return { ok: false, status: 502, error: "This track's waveform was empty." };
    }

    const resolved: ResolvedTrack = {
      title: track.title || "SoundCloud Track",
      durationMs: track.duration,
      samples: waveform.samples,
      height: waveform.height && waveform.height > 0 ? waveform.height : 100,
      artwork: track.artwork_url ?? null,
    };

    // Cache (bounded — drop oldest when full).
    if (trackCache.size >= TRACK_CACHE_MAX) {
      const firstKey = trackCache.keys().next().value;
      if (firstKey !== undefined) trackCache.delete(firstKey);
    }
    trackCache.set(url, resolved);

    return { ok: true, track: resolved };
  }

  return { ok: false, status: 502, error: "SoundCloud authentication failed. Try again." };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";

  // Accept only real soundcloud.com track links.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: "Please enter a valid SoundCloud URL." }, { status: 400 });
  }
  if (!/(^|\.)soundcloud\.com$/.test(parsed.hostname)) {
    return Response.json({ error: "That's not a SoundCloud link." }, { status: 400 });
  }

  try {
    const result = await resolveTrack(url);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(result.track);
  } catch (err) {
    console.error("[wave-rider/soundcloud]", err);
    return Response.json({ error: "Something went wrong loading that track." }, { status: 500 });
  }
}
