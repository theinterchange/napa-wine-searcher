import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Napa Sonoma Guide",
  description: "Privacy policy for Napa Sonoma Guide - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Last updated: March 5, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            <strong>Account Information:</strong> When you create an account, we collect your name, email address, and a hashed version of your password. We never store your password in plain text.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Usage Data:</strong> We collect information about how you interact with the site, including wineries you favorite, visits you log, journal entries, collections, and trip plans you create.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Cookies:</strong> We use only essential session cookies required for authentication. We do not use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1 text-[var(--muted-foreground)]">
            <li>To provide and maintain your account and personalized features</li>
            <li>To save your favorites, visited wineries, journal entries, collections, and trip plans</li>
            <li>To enable sharing features (public profiles, shared trips and collections)</li>
            <li>To improve our service and fix bugs</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">3. Third-Party Services</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            <strong>Affiliate Links:</strong> Some winery pages contain links to external booking sites. When you click these links, the destination site may collect its own data subject to their privacy policies.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Analytics:</strong> We may use privacy-friendly analytics (such as Plausible) that do not use cookies or collect personal data. Any analytics data is aggregated and anonymous.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">4. Data Sharing</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We may share data only when required by law or to protect our rights.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">5. Data Security</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We use industry-standard security measures to protect your data, including encrypted connections (HTTPS), hashed passwords, and secure session management.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">6. Your Rights</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            You have the right to access, correct, or delete your personal data. To request data access or account deletion, please contact us at the email below. We will respond within 30 days.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Note:</strong> Email addresses are not currently verified during signup. Account deletion is available by contacting us directly.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">7. Age Requirement</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            This site is intended for users who are 21 years of age or older. Account creation requires confirmation that you meet this age requirement.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">8. Changes to This Policy</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We may update this policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">9. Contact Us</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            If you have questions about this privacy policy or your data, please contact us at{" "}
            <a href="mailto:privacy@winecountryguide.com" className="text-burgundy-700 dark:text-burgundy-400 hover:underline">
              privacy@winecountryguide.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
