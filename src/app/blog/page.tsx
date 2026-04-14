import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blog";
import BlogCard from "@/components/blog/BlogCard";

export const metadata: Metadata = buildArticleMetadata({
  title: "Blog — Game Tips, Guides & Puzzle Strategy",
  description:
    "Game tips, strategy guides, and puzzle-solving insights from the Gamesite team. Level up your daily puzzle skills.",
  slug: "",
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-body text-3xl font-bold text-text-primary mb-2">
        Blog
      </h1>
      <p className="text-text-dim text-sm mb-8">
        Game tips, strategy guides, and puzzle-solving insights.
      </p>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light p-10 text-center shadow-sm">
          <p className="text-text-dim text-sm">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
