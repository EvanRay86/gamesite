import { buildFAQPageJsonLd } from "@/lib/seo";
import type { FAQ } from "@/types/hints";

export default function GameFAQ({ faqs }: { faqs: FAQ[] }) {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-12 text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
      <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
        Frequently Asked Questions
      </h2>
      {faqs.map((faq, i) => (
        <details
          key={i}
          className="group rounded-lg border border-zinc-200 dark:border-zinc-700"
        >
          <summary className="cursor-pointer select-none px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
            {faq.question}
          </summary>
          <p className="px-4 pb-3 pt-1">{faq.answer}</p>
        </details>
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildFAQPageJsonLd(faqs)),
        }}
      />
    </section>
  );
}
