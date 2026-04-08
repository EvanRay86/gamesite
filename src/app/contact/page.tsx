import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Gamesite team.",
  alternates: { canonical: "https://gamesite.app/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary mb-2">
          Contact Us
        </h1>
        <p className="text-sm text-text-dim mb-8">We&apos;d love to hear from you.</p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">General Inquiries</h2>
            <p>
              For questions, feedback, or suggestions about Gamesite, email us at{" "}
              <a href="mailto:hello@gamesite.app" className="text-coral hover:text-coral-dark transition-colors">
                hello@gamesite.app
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Privacy &amp; Data Requests</h2>
            <p>
              To exercise your data rights (access, correction, or deletion of personal data),
              contact our privacy team at{" "}
              <a href="mailto:privacy@gamesite.app" className="text-coral hover:text-coral-dark transition-colors">
                privacy@gamesite.app
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Billing &amp; Subscriptions</h2>
            <p>
              For questions about your premium subscription or arcade credits, email{" "}
              <a href="mailto:hello@gamesite.app" className="text-coral hover:text-coral-dark transition-colors">
                hello@gamesite.app
              </a>
              {" "}or manage your subscription directly from your{" "}
              <Link href="/account" className="text-coral hover:text-coral-dark transition-colors">
                Account page
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">Response Time</h2>
            <p>
              We aim to respond to all inquiries within 48 hours during business days.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-border-light flex gap-4">
          <Link href="/about" className="text-sm text-coral hover:text-coral-dark transition-colors no-underline">
            About &rarr;
          </Link>
          <Link href="/privacy" className="text-sm text-coral hover:text-coral-dark transition-colors no-underline">
            Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
