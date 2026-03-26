import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Gamesite collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-sm">
        <h1 className="font-body text-3xl font-bold text-text-primary mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-dim mb-8">Last updated: March 25, 2026</p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">1. Information We Collect</h2>
            <p>
              When you use Gamesite, we may collect the following types of information:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Usage data:</strong> pages visited, games played, scores, and interaction patterns.</li>
              <li><strong>Device data:</strong> browser type, operating system, screen resolution, and language preferences.</li>
              <li><strong>Cookies:</strong> small text files stored on your device to remember preferences and improve your experience.</li>
              <li><strong>Account data:</strong> if you create an account or subscribe, we collect your email address and payment information (processed securely by our payment provider).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve our games and services.</li>
              <li>To save your game progress, streaks, and preferences.</li>
              <li>To process subscriptions and payments.</li>
              <li>To analyze usage patterns and improve site performance.</li>
              <li>To communicate service updates (only if you opt in).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">3. Cookies</h2>
            <p>
              We use essential cookies to keep the site functional (e.g., remembering your cookie preferences)
              and optional analytics cookies to understand how the site is used. You can manage your cookie
              preferences at any time through the banner at the bottom of the page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share anonymized, aggregated data with
              analytics providers to improve our services. Payment data is handled directly by our
              payment processor and is never stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services.
              You can request deletion of your data by contacting us. Game progress stored locally in
              your browser can be cleared at any time through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of analytics cookies.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">7. Children&apos;s Privacy</h2>
            <p>
              Gamesite is intended for a general audience. We do not knowingly collect personal
              information from children under 13. If you believe we have collected such information,
              please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify users of material
              changes by posting a notice on our site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-2">9. Contact</h2>
            <p>
              If you have questions about this privacy policy, please contact us at{" "}
              <a href="mailto:privacy@gamesite.app" className="text-coral hover:text-coral-dark transition-colors">
                privacy@gamesite.app
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-border-light">
          <Link href="/terms" className="text-sm text-coral hover:text-coral-dark transition-colors no-underline">
            View Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
