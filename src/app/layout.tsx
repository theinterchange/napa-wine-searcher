import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingTripBar } from "@/components/trip/FloatingTripBar";
import { Analytics } from "@vercel/analytics/next";

import { BASE_URL } from "@/lib/constants";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif-text",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  // Used for body text below the fold (winery descriptions, prose). The
  // hero uses Fraunces + JetBrains Mono only, so we don't need this on the
  // LCP-critical path. Browsers fetch it on-demand when CSS first uses it,
  // and display:swap keeps fallback in place until then.
  preload: false,
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  // Body fallback only (3 CSS refs). Not in the hero. Skip preload.
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Napa Sonoma Guide | Napa & Sonoma Valley Wineries",
    template: "%s | Napa Sonoma Guide",
  },
  description:
    "Discover the finest wineries in Napa and Sonoma Valleys. Browse wines, compare tasting experiences, and plan your wine country visit.",
  // icons removed — Next.js App Router auto-detects src/app/icon.svg,
  // src/app/icon.png, and src/app/apple-icon.png and emits the right
  // <link rel="icon"> + <link rel="apple-touch-icon"> headers.
  openGraph: {
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      <Script
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token": "97c024ab0f6248e5a53e4f3fb25e8286"}'
        strategy="afterInteractive"
      />

      <body className={`${fraunces.variable} ${sourceSerif.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Napa Sonoma Guide",
              url: BASE_URL,
              description:
                "Discover the finest wineries in Napa and Sonoma Valleys. Browse wines, compare tasting experiences, and plan your wine country visit.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${BASE_URL}/wineries?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-burgundy-700 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
          <FloatingTripBar />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
