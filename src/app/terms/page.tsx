import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Napa Sonoma Guide",
  description: "Terms of service for Napa Sonoma Guide.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Last updated: March 5, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            By accessing or using Napa Sonoma Guide, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">2. Account Terms</h2>
          <ul className="list-disc pl-5 space-y-1 text-[var(--muted-foreground)]">
            <li>You must be 21 years of age or older to create an account</li>
            <li>You are responsible for maintaining the security of your account and password</li>
            <li>You are responsible for all activity that occurs under your account</li>
            <li>You must provide accurate information when creating your account</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">3. Acceptable Use</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            You agree not to misuse the service. This includes but is not limited to: attempting to access unauthorized areas of the site, scraping data without permission, submitting false or misleading content, or using the service for any illegal purpose.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">4. Content & AI Assistance</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed mb-3">
            Some editorial content on this site, including property descriptions, guides, and recommendations, is created with the assistance of artificial intelligence tools and reviewed by our team for accuracy. We use AI to help research and draft content, but all information is verified against public sources before publication.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Winery and accommodation information, including hours, prices, amenities, and tasting details, is provided for informational purposes only. While we strive to keep data accurate and up-to-date, details may change without notice. We recommend contacting venues directly to confirm current information before visiting.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">5. Affiliate Links & External Sites</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Some links on this site may be affiliate links, meaning we may earn a commission if you make a purchase through them. This does not affect the price you pay. We are not responsible for the content, policies, or practices of external websites linked from our service.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">6. Intellectual Property</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            The Napa Sonoma Guide name, logo, and original content are protected by copyright. Winery names, logos, and associated trademarks belong to their respective owners. User-generated content (journal entries, notes, reviews) remains the property of the user.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">7. Limitation of Liability</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Napa Sonoma Guide is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to inaccurate winery information, service interruptions, or data loss. Use this service at your own risk.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">8. Alcohol Disclaimer</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Napa Sonoma Guide provides information about wineries and wine tasting. You must be 21 years of age or older to consume alcohol in the United States. Please drink responsibly and never drink and drive.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">9. Termination</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We reserve the right to suspend or terminate your account at any time for violation of these terms or for any reason at our discretion.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">10. Changes to Terms</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">11. Contact</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@winecountryguide.com" className="text-[var(--foreground)] hover:underline">
              legal@winecountryguide.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
