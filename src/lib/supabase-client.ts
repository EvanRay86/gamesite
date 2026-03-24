import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * Client-side Supabase instance.
 * Returns null if env vars are not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-supabase-url-here") {
    return null;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

/**
 * Get or create an anonymous player ID stored in localStorage.
 * This persists across sessions on the same browser.
 */
export function getPlayerId(): string {
  const KEY = "gamesite-player-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
