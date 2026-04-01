import { createSupabaseServer } from "./supabase-server";

/**
 * Server-side check: does the current user have an active subscription?
 * Safe to call from Server Components and Route Handlers.
 *
 * Paywall disabled — all content is free (monetised via ads).
 */
export async function isUserSubscribed(): Promise<boolean> {
  return true;
}
