import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CompareFloatingBar } from "@/components/compare/CompareFloatingBar";
import { Analytics } from "@vercel/analytics/next";

import { BASE_URL } from "@/lib/constants";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Napa Sonoma Guide | Napa & Sonoma Valley Wineries",
    template: "%s | Napa Sonoma Guide",
  },
  description:
    "Discover the finest wineries in Napa and Sonoma Valleys. Browse wines, compare tasting experiences, and plan your wine country visit.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
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
      <head>
        <link
          rel="preconnect"
          href="https://iubllytv2maaomk9.public.blob.vercel-storage.com"
        />
      </head>
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
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
          <CompareFloatingBar />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
