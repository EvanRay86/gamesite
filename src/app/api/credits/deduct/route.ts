import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getGameBySlug } from "@/lib/game-registry";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { gameSlug } = await request.json();

    if (!gameSlug) {
      return NextResponse.json({ error: "Missing gameSlug" }, { status: 400 });
    }

    const game = getGameBySlug(gameSlug);
    if (!game || !game.creditCost || game.creditCost <= 0) {
      return NextResponse.json({ error: "Game does not require credits" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: remaining, error } = await admin.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: game.creditCost,
      p_reason: `game_${gameSlug}`,
    });

    if (error) {
      console.error("Credit deduction error:", error);
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
    }

    if (remaining === -1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    return NextResponse.json({ success: true, remainingCredits: remaining });
  } catch (err) {
    console.error("Credit deduction error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
