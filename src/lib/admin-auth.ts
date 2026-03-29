import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Verify that the current request is from an authenticated admin user.
 * Returns the user ID if authorized, or a NextResponse error to return immediately.
 *
 * Admin users are identified by having `is_admin = true` in user_profiles.
 * Falls back to checking an ADMIN_EMAILS env var (comma-separated) if the
 * is_admin column doesn't exist yet.
 */
export async function requireAdmin(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  // Check admin status via profile flag
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin === true) {
      return { userId: user.id };
    }
  }

  // Fallback: check ADMIN_EMAILS env var
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) =>
    e.trim().toLowerCase(),
  );

  if (adminEmails && user.email && adminEmails.includes(user.email.toLowerCase())) {
    return { userId: user.id };
  }

  return {
    error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
