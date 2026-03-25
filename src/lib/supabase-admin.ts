import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

/** Server-side only Supabase client using service role key — bypasses RLS. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}
