import Link from "next/link";
import type { BlogPost } from "@/types/blog";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-border-light
                 shadow-sm hover:shadow-md transition-all duration-200 no-underline"
    >
      <div className="h-1 rounded-t-xl bg-teal" />
      <div className="p-5">
        <span className="inline-block text-[11px] font-semibold text-teal bg-teal/10 rounded-full px-2.5 py-0.5 mb-3">
          {post.category}
        </span>
        <h2 className="text-base font-bold text-text-primary group-hover:text-teal transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-text-dim text-sm mt-1.5 leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
        {post.published_at && (
          <p className="text-text-dim text-xs mt-3">
            {formatDate(post.published_at)}
          </p>
        )}
      </div>
    </Link>
  );
}
