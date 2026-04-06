import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Napa Sonoma Guide",
  description: "Privacy policy for Napa Sonoma Guide - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Last updated: March 30, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            <strong>Account Information:</strong> When you create an account, we collect your name, email address, and a hashed version of your password. We never store your password in plain text.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Usage Data:</strong> We collect information about how you interact with the site, including wineries you favorite, visits you log, journal entries, and trip plans you create.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Click Data:</strong> When you click outbound links (such as winery websites, booking links, or affiliate links), we log the type of click, the destination URL, and the page you were on. This data is not linked to your account and is used to understand which content is most useful to our visitors. Click data is retained for 90 days.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Cookies:</strong> We use only essential session cookies required for authentication. We do not use tracking cookies, advertising cookies, or third-party marketing cookies.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1 text-[var(--muted-foreground)]">
            <li>To provide and maintain your account and personalized features</li>
            <li>To save your favorites, visited wineries, journal entries, and trip plans</li>
            <li>To enable sharing features (shared trips and collections, when you choose to share)</li>
            <li>To improve our service, understand what content is most useful, and fix bugs</li>
            <li>To send transactional emails (password resets) — we do not send marketing emails</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">3. Third-Party Services</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We use a small number of trusted third-party services to operate this site:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--muted-foreground)] mt-2">
            <li><strong>Vercel</strong> — hosting and image optimization</li>
            <li><strong>Turso</strong> — database hosting (your data is encrypted in transit)</li>
            <li><strong>Resend</strong> — transactional email delivery (password resets only)</li>
            <li><strong>Vercel Web Analytics</strong> — privacy-friendly pageview analytics, no cookies, no personal data collected</li>
            <li><strong>Cloudflare Web Analytics</strong> — server-side pageview measurement via our CDN, cookie-free</li>
            <li><strong>Google Maps</strong> — map display and location services on map pages</li>
          </ul>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            <strong>Affiliate Links:</strong> Some pages contain links to hotel booking sites and wine retailers. When you click these links, the destination site may collect its own data subject to their privacy policies. We may earn a commission from bookings made through these links, at no extra cost to you.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">4. Data Sharing</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties. We share data only with the service providers listed above, solely for the purpose of operating this site, and when required by law.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">5. Data Retention</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Account data (profile, favorites, journal entries, trips) is retained for as long as your account is active. If you delete your account, all associated data is permanently removed. Anonymous click tracking data is retained for 90 days and then deleted.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">6. Data Security</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We use industry-standard security measures to protect your data, including encrypted connections (HTTPS), hashed passwords (bcrypt), secure session management, and security headers to prevent common web attacks.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">7. Your Rights</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[var(--muted-foreground)] mt-2">
            <li><strong>Access</strong> your personal data — you can view all your data in your account settings</li>
            <li><strong>Export</strong> your data — download a copy of all your data from your account settings</li>
            <li><strong>Correct</strong> your data — update your profile information at any time</li>
            <li><strong>Delete</strong> your account and all associated data from your account settings</li>
          </ul>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            For any data requests we cannot fulfill through the site, contact us at the email below. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">8. Age Requirement</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            This site is intended for users who are 21 years of age or older. We do not knowingly collect information from anyone under 21.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">9. Changes to This Policy</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We may update this policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold mt-8 mb-3">10. Contact Us</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            If you have questions about this privacy policy or your data, please contact us at{" "}
            <a href="mailto:theinterchangestudio@gmail.com" className="text-[var(--foreground)] hover:underline">
              theinterchangestudio@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
