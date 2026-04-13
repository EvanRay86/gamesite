import { createSupabaseServer } from "@/lib/supabase-server";
import type { BlogPost } from "@/types/blog";

/**
 * Fetch published blog posts, sorted by published_at descending.
 */
export async function getPublishedPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

/**
 * Fetch a single published blog post by its slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data as BlogPost;
}

/**
 * Fetch published blog posts filtered by category.
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .eq("category", category)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

/**
 * Fetch all published post slugs (for sitemap generation).
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true);

  if (error) throw error;
  return (data ?? []).map((row) => row.slug);
}
