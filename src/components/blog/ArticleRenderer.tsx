export default function ArticleRenderer({ content }: { content: string }) {
  return (
    <div
      className="prose prose-zinc max-w-none
                 prose-headings:font-bold prose-headings:text-text-primary
                 prose-p:text-text-secondary prose-p:leading-relaxed
                 prose-a:text-coral hover:prose-a:text-coral-dark
                 prose-li:text-text-secondary
                 prose-strong:text-text-primary
                 prose-img:rounded-xl"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
