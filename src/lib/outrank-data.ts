import { getSupabase } from "./supabase";
import type { OutrankItem, OutrankChallenge } from "@/types/outrank";

/** Fetch the full active comparison pool for server-rendering a round. */
export async function getOutrankPool(): Promise<OutrankItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("outrank_items")
    .select("id, category, label, value, emoji, image_url, source, blurb")
    .eq("active", true);

  if (error || !data) return [];
  return data as OutrankItem[];
}

/** Fetch a stored challenge by its short id (public-read). */
export async function getChallenge(
  id: string,
): Promise<OutrankChallenge | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("outrank_challenges")
    .select("id, seed, challenger_name, challenger_score, category_set, pool_version")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    seed: Number(data.seed),
    challengerName: data.challenger_name,
    challengerScore: data.challenger_score,
    categorySet: data.category_set,
    poolVersion: data.pool_version,
  };
}
