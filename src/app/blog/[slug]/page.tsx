import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog";
import {
  buildArticleMetadata,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import ArticleRenderer from "@/components/blog/ArticleRenderer";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return buildArticleMetadata({
    title: post.title,
    description: post.meta_description,
    slug: post.slug,
    image: post.featured_image ?? undefined,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const articleJsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.meta_description,
    slug: post.slug,
    author: post.author,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    image: post.featured_image ?? undefined,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: "https://gamesite.app" },
    { name: "Blog", url: "https://gamesite.app/blog" },
    { name: post.title, url: `https://gamesite.app/blog/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="mx-auto max-w-[720px] px-4 py-10">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-teal hover:text-teal/80 transition-colors no-underline mb-6"
        >
          &larr; Back to Blog
        </Link>

        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-sm">
          <span className="inline-block text-[11px] font-semibold text-teal bg-teal/10 rounded-full px-2.5 py-0.5 mb-4">
            {post.category}
          </span>

          <h1 className="font-body text-3xl font-bold text-text-primary mb-3">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-text-dim mb-8">
            <span>{post.author}</span>
            <span aria-hidden="true">&middot;</span>
            {post.published_at && <time>{formatDate(post.published_at)}</time>}
          </div>

          <ArticleRenderer content={post.content} />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-block rounded-full px-5 py-2 text-sm font-semibold bg-teal/10 text-teal hover:bg-teal/20 transition-colors no-underline"
          >
            &larr; Back to Blog
          </Link>
        </div>
      </article>
    </>
  );
}
