import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Napa Sonoma Guide",
  description: "Terms of service for Napa Sonoma Guide.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <span className="kicker">Legal · Last updated 2026-03-05</span>
        <h1 className="editorial-h2 text-[34px] sm:text-[44px] mt-3">
          Terms of <em>Service.</em>
        </h1>
        <hr className="rule-brass mt-5 mb-0" />
      </header>

      <div className="editorial-prose">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Napa Sonoma Guide, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site.
        </p>

        <h2>2. Account Terms</h2>
        <ul>
          <li>You must be 21 years of age or older to create an account</li>
          <li>You are responsible for maintaining the security of your account and password</li>
          <li>You are responsible for all activity that occurs under your account</li>
          <li>You must provide accurate information when creating your account</li>
        </ul>

        <h2>3. Acceptable Use</h2>
        <p>
          You agree not to misuse the service. This includes but is not limited to: attempting to access unauthorized areas of the site, scraping data without permission, submitting false or misleading content, or using the service for any illegal purpose.
        </p>

        <h2>4. Content &amp; AI Assistance</h2>
        <p>
          Some editorial content on this site, including property descriptions, guides, and recommendations, is created with the assistance of artificial intelligence tools and reviewed by our team for accuracy. We use AI to help research and draft content, but all information is verified against public sources before publication.
        </p>
        <p>
          Winery and accommodation information, including hours, prices, amenities, and tasting details, is provided for informational purposes only. While we strive to keep data accurate and up-to-date, details may change without notice. We recommend contacting venues directly to confirm current information before visiting.
        </p>

        <h2>5. Affiliate Links &amp; External Sites</h2>
        <p>
          Some links on this site may be affiliate links, meaning we may earn a commission if you make a purchase through them. This does not affect the price you pay. We are not responsible for the content, policies, or practices of external websites linked from our service.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          The Napa Sonoma Guide name, logo, and original content are protected by copyright. Winery names, logos, and associated trademarks belong to their respective owners. User-generated content (journal entries, notes, reviews) remains the property of the user.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          Napa Sonoma Guide is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to inaccurate winery information, service interruptions, or data loss. Use this service at your own risk.
        </p>

        <h2>8. Alcohol Disclaimer</h2>
        <p>
          Napa Sonoma Guide provides information about wineries and wine tasting. You must be 21 years of age or older to consume alcohol in the United States. Please drink responsibly and never drink and drive.
        </p>

        <h2>9. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of these terms or for any reason at our discretion.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <a href="mailto:legal@winecountryguide.com">legal@winecountryguide.com</a>.
        </p>
      </div>
    </div>
  );
}
