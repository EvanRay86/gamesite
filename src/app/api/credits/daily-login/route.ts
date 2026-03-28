import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** POST — Claim daily login credits. GET — Fetch streak info. */

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data, error } = await admin.rpc("claim_daily_login", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Daily login claim error:", error);
      return NextResponse.json({ error: "Failed to claim daily login" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Daily login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Get recent logins (last 30 days) for calendar display
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentLogins, error: loginsError } = await admin
      .from("daily_logins")
      .select("login_date, credits_awarded, streak_day, streak_bonus")
      .eq("user_id", user.id)
      .gte("login_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("login_date", { ascending: false });

    if (loginsError) {
      console.error("Fetch logins error:", loginsError);
      return NextResponse.json({ error: "Failed to fetch login data" }, { status: 500 });
    }

    // Get total days logged in
    const { count, error: countError } = await admin
      .from("daily_logins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Count error:", countError);
    }

    // Determine current streak
    const today = new Date().toISOString().split("T")[0];
    const todayLogin = recentLogins?.find((l) => l.login_date === today);
    const currentStreak = todayLogin?.streak_day ?? 0;

    // Check if today has been claimed
    const claimedToday = !!todayLogin;

    return NextResponse.json({
      current_streak: currentStreak,
      claimed_today: claimedToday,
      total_days: count ?? 0,
      recent_logins: recentLogins ?? [],
    });
  } catch (err) {
    console.error("Daily login fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
