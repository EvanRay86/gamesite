// ── Wave Rider · audio proxy ─────────────────────────────────────────────────
// Direct audio-file URLs almost never send CORS headers, so the browser can't
// fetch + decode them. This route pulls the bytes server-side (no CORS) and
// streams them back same-origin, where the client decodes them with Web Audio
// for TRUE waveform analysis — identical to an upload.
//
// Because it fetches an arbitrary user-supplied URL, it is a deliberate SSRF
// surface: we reject non-http(s) schemes, block private / loopback / link-local
// / cloud-metadata addresses (re-checking on every redirect hop), require an
// audio content-type, and cap the response size.

import { lookup } from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 30 * 1024 * 1024; // 30 MB
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 20_000;
const UA = "Mozilla/5.0 (WaveRider audio proxy)";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("blocked host");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("blocked ip");
    return;
  }
  const results = await lookup(host, { all: true });
  if (results.length === 0) throw new Error("no dns");
  for (const r of results) if (isPrivateIp(r.address)) throw new Error("blocked ip");
}

/** Fetch with SSRF guards, following redirects manually so each hop is re-validated. */
async function fetchGuarded(initialUrl: string): Promise<Response> {
  let url = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    await assertPublicHost(parsed.hostname);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "User-Agent": UA, Accept: "audio/*,application/ogg,*/*" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get("location");
      if (!loc) throw new Error("redirect without location");
      url = new URL(loc, url).toString();
      continue;
    }
    return resp;
  }
  throw new Error("too many redirects");
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!target) {
    return Response.json({ error: "Missing audio URL." }, { status: 400 });
  }

  let resp: Response;
  try {
    resp = await fetchGuarded(target);
  } catch {
    return Response.json(
      { error: "That link couldn't be loaded (or points somewhere that isn't allowed)." },
      { status: 400 }
    );
  }

  if (!resp.ok || !resp.body) {
    return Response.json(
      { error: `The host returned ${resp.status} for that link.` },
      { status: 502 }
    );
  }

  // Some hosts mislabel audio as octet-stream; allow that, reject obvious non-audio.
  const ctype = (resp.headers.get("content-type") || "").toLowerCase();
  const looksAudio = /^audio\//.test(ctype) || /application\/(ogg|octet-stream)/.test(ctype) || ctype === "";
  if (!looksAudio) {
    return Response.json({ error: "That link isn't an audio file." }, { status: 415 });
  }

  const declaredLen = Number(resp.headers.get("content-length") || "0");
  if (declaredLen && declaredLen > MAX_BYTES) {
    return Response.json({ error: "That audio file is too large (max 30 MB)." }, { status: 413 });
  }

  // Read with a hard cap (covers chunked responses that omit content-length).
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      try { await reader.cancel(); } catch { /* ignore */ }
      return Response.json({ error: "That audio file is too large (max 30 MB)." }, { status: 413 });
    }
    chunks.push(value);
  }

  const body = Buffer.concat(chunks, total);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": /^audio\//.test(ctype) ? ctype : "audio/mpeg",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
