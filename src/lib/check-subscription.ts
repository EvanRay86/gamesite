import { createSupabaseServer } from "./supabase-server";

/**
 * Server-side check: does the current user have an active subscription?
 * Safe to call from Server Components and Route Handlers.
 */
export async function isUserSubscribed(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Admins bypass the paywall
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) return true;

    const { data } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .limit(1)
      .single();

    return !!data;
  } catch {
    return false;
  }
}
