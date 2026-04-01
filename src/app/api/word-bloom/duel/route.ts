import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST — create or join a duel room.
 * Body: { playerName: string; action: "create" | "join"; roomId?: string }
 *
 * GET  — fetch room state.
 * Query: ?roomId=...
 */

const SEED_PUZZLES: string[][] = [
  ["R", "T", "A", "D", "I", "N", "G"],
  ["L", "P", "A", "C", "I", "N", "G"],
  ["E", "S", "H", "L", "T", "A", "R"],
  ["A", "R", "O", "S", "T", "I", "N"],
  ["N", "P", "O", "I", "D", "E", "T"],
  ["T", "C", "O", "U", "N", "R", "E"],
  ["S", "B", "L", "A", "T", "E", "R"],
  ["I", "W", "N", "S", "O", "M", "E"],
  ["O", "F", "R", "M", "I", "N", "G"],
  ["E", "P", "R", "O", "N", "D", "S"],
  ["A", "C", "B", "L", "E", "T", "H"],
  ["T", "P", "L", "A", "S", "E", "R"],
  ["I", "C", "L", "A", "M", "E", "D"],
  ["E", "H", "O", "S", "T", "I", "N"],
  ["A", "D", "U", "R", "B", "L", "E"],
];

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`bloom-duel:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: { playerName?: string; action?: string; roomId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { playerName, action, roomId } = body;

  if (!playerName || typeof playerName !== "string" || playerName.length > 20) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  if (action === "create") {
    const newRoomId = generateRoomId();
    const letters = SEED_PUZZLES[Math.floor(Math.random() * SEED_PUZZLES.length)];

    const { error } = await supabase.from("word_bloom_duels").insert({
      room_id: newRoomId,
      letters,
      host_name: playerName.trim(),
      status: "waiting",
    });

    if (error) {
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }

    return NextResponse.json({ roomId: newRoomId, letters });
  }

  if (action === "join") {
    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const { data: room, error: fetchErr } = await supabase
      .from("word_bloom_duels")
      .select("*")
      .eq("room_id", roomId.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (fetchErr || !room) {
      return NextResponse.json({ error: "Room not found or already started" }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from("word_bloom_duels")
      .update({
        guest_name: playerName.trim(),
        status: "ready",
      })
      .eq("room_id", roomId.toUpperCase())
      .eq("status", "waiting");

    if (updateErr) {
      return NextResponse.json({ error: "Failed to join" }, { status: 500 });
    }

    return NextResponse.json({
      roomId: roomId.toUpperCase(),
      letters: room.letters,
      hostName: room.host_name,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("word_bloom_duels")
    .select("*")
    .eq("room_id", roomId.toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    roomId: data.room_id,
    letters: data.letters,
    hostName: data.host_name,
    guestName: data.guest_name,
    status: data.status,
  });
}
