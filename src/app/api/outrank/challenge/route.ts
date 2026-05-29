import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { POOL_VERSION } from "@/lib/outrank-categories";

/** POST — create a shareable challenge from a finished run.
 *  GET  — fetch a challenge by ?id=... */

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const MAX_SEED = 0xffffffff;

function generateChallengeId(): string {
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return id;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`outrank-ch:${ip}`, { limit: 15, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: {
    name?: string;
    score?: number;
    seed?: number;
    categorySet?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, score, seed, categorySet } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 20) {
    return NextResponse.json({ error: "Invalid name (1-20 chars)" }, { status: 400 });
  }
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 9999) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  if (
    typeof seed !== "number" ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > MAX_SEED
  ) {
    return NextResponse.json({ error: "Invalid seed" }, { status: 400 });
  }
  const set =
    typeof categorySet === "string" && categorySet.length <= 32
      ? categorySet
      : "mixed";

  // Insert with a fresh id, retrying on the rare primary-key collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateChallengeId();
    const { error } = await supabase.from("outrank_challenges").insert({
      id,
      seed,
      challenger_name: name.trim(),
      challenger_score: Math.floor(score),
      category_set: set,
      pool_version: POOL_VERSION,
      ip_hash: simpleHash(ip),
    });

    if (!error) {
      return NextResponse.json({ id });
    }
    // 23505 = unique_violation → retry with a new id; otherwise bail.
    if (error.code !== "23505") {
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not allocate id" }, { status: 500 });
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("outrank_challenges")
    .select("id, seed, challenger_name, challenger_score, category_set, pool_version")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    seed: Number(data.seed),
    challengerName: data.challenger_name,
    challengerScore: data.challenger_score,
    categorySet: data.category_set,
    poolVersion: data.pool_version,
  });
}

/** Simple non-reversible hash for IP privacy. */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}
