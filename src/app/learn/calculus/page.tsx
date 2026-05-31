import type { Metadata } from "next";
import { buildGameMetadata, buildBreadcrumbJsonLd, buildFAQPageJsonLd } from "@/lib/seo";
import { getAllCalcFaqs } from "./faq-data";
import TeachMeCalculusClient from "./TeachMeCalculusClient";

const siteUrl = "https://gamesite.app";

export const metadata: Metadata = buildGameMetadata({
  title: "Teach Me Calculus — Learn Calculus Free with Interactive Graphs",
  description:
    "Learn calculus free on one page: limits, derivatives, integrals, series, and multivariable. Interactive graphs you can drag, unlimited practice problems with step-by-step solutions, real-world examples, and FAQs.",
  path: "learn/calculus",
  color: "purple",
});

const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Teach Me Calculus",
  description:
    "A free, interactive single-page calculus course covering limits, derivatives, integrals, sequences and series, differential equations, and multivariable calculus — with live graphs and unlimited practice problems.",
  url: `${siteUrl}/learn/calculus`,
  provider: {
    "@type": "Organization",
    name: "Gamesite",
    url: siteUrl,
  },
  isAccessibleForFree: true,
  educationalLevel: "High school and college (AP Calculus AB/BC, Calculus I–III)",
  about: [
    "Calculus",
    "Limits",
    "Derivatives",
    "Integrals",
    "Differential equations",
    "Multivariable calculus",
  ],
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT20H",
  },
};

const breadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", url: siteUrl },
  { name: "Learn", url: `${siteUrl}/learn` },
  { name: "Teach Me Calculus", url: `${siteUrl}/learn/calculus` },
]);

const faqJsonLd = buildFAQPageJsonLd(getAllCalcFaqs());

export default function TeachMeCalculusPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <TeachMeCalculusClient />
    </main>
  );
}
