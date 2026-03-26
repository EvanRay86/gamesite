import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Gamesite.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-text-dim mb-8">Last updated: March 25, 2026</p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Gamesite (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">2. Description of Service</h2>
            <p>
              Gamesite provides free and subscription-based browser games including daily puzzles,
              trivia, and arcade games. The Service is provided &quot;as is&quot; and we reserve the right
              to modify, suspend, or discontinue any part of the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the security of your account.</li>
              <li>You must provide accurate information when creating an account.</li>
              <li>You may not share your account credentials with others.</li>
              <li>We reserve the right to suspend accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">4. Subscriptions and Payments</h2>
            <p>
              Paid subscriptions provide access to premium features including puzzle archives and
              monthly credits. Subscriptions renew automatically unless cancelled before the renewal date.
              Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use automated tools, bots, or scripts to interact with the Service.</li>
              <li>Attempt to exploit, hack, or reverse-engineer any part of the Service.</li>
              <li>Interfere with other users&apos; enjoyment of the Service.</li>
              <li>Use the Service for any unlawful purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">6. Intellectual Property</h2>
            <p>
              All content on Gamesite, including games, graphics, text, and code, is owned by
              Gamesite or its licensors and is protected by copyright and intellectual property laws.
              You may not reproduce, distribute, or create derivative works without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">7. Limitation of Liability</h2>
            <p>
              Gamesite is provided on an &quot;as is&quot; basis without warranties of any kind. We are not
              liable for any damages arising from your use of the Service, including but not limited to
              loss of data, game progress, or credits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">8. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the updated terms. We will notify users of material changes
              through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">9. Contact</h2>
            <p>
              If you have questions about these terms, please contact us at{" "}
              <a href="mailto:hello@gamesite.app" className="text-coral hover:text-coral-dark transition-colors">
                hello@gamesite.app
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-border-light">
          <Link href="/privacy" className="text-sm text-coral hover:text-coral-dark transition-colors no-underline">
            View Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
