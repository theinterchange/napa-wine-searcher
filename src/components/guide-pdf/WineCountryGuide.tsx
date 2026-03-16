import React from "react";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const FONTS = path.resolve(process.cwd(), "planning-guide/fonts");
const PHOTOS = path.resolve(process.cwd(), "planning-guide/photos-new");

// ---------------------------------------------------------------------------
// Register fonts
// ---------------------------------------------------------------------------
// Variable font files — same file registered at multiple weights
const cormorantRegular = path.join(FONTS, "CormorantGaramond-Regular.ttf");
const cormorantItalic = path.join(FONTS, "CormorantGaramond-Italic.ttf");
const sourceSansRegular = path.join(FONTS, "SourceSans3-Regular.ttf");
const sourceSansItalic = path.join(FONTS, "SourceSans3-Italic.ttf");

Font.register({
  family: "Cormorant",
  fonts: [
    { src: cormorantRegular, fontWeight: 400 },
    { src: cormorantRegular, fontWeight: 500 },
    { src: cormorantRegular, fontWeight: 700 },
    { src: cormorantItalic, fontStyle: "italic", fontWeight: 400 },
    { src: cormorantItalic, fontStyle: "italic", fontWeight: 700 },
  ],
});

Font.register({
  family: "CormorantSC",
  fonts: [
    { src: path.join(FONTS, "CormorantSC-Bold.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: "SourceSans",
  fonts: [
    { src: sourceSansRegular, fontWeight: 300 },
    { src: sourceSansRegular, fontWeight: 400 },
    { src: sourceSansRegular, fontWeight: 600 },
    { src: sourceSansItalic, fontStyle: "italic", fontWeight: 400 },
  ],
});

// Disable hyphenation for cleaner text
Font.registerHyphenationCallback((word) => [word]);

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
  burgundy: "#6B2D3E",
  burgundyDark: "#4A1E2B",
  burgundyLight: "#8A4558",
  cream: "#FAF6F1",
  ivory: "#F5EFE6",
  sand: "#E6DDD2",
  warmGray: "#F0EBE4",
  stone: "#D4C9BC",
  ink: "#1F1A17",
  body: "#3A332D",
  caption: "#8A7E73",
  gold: "#B8963E",
  goldLight: "#D4B86A",
  olive: "#5C6B3C",
  white: "#FFFFFF",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  // Pages
  page: {
    fontFamily: "SourceSans",
    fontSize: 10,
    color: C.body,
    lineHeight: 1.6,
  },
  pageIvory: {
    fontFamily: "SourceSans",
    fontSize: 10,
    color: C.body,
    lineHeight: 1.6,
    backgroundColor: C.ivory,
  },
  pageCream: {
    fontFamily: "SourceSans",
    fontSize: 10,
    color: C.body,
    lineHeight: 1.6,
    backgroundColor: C.cream,
  },

  // Cover
  coverPage: {
    position: "relative",
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(31, 26, 23, 0.50)",
  },
  coverContent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverRule: {
    width: 60,
    height: 1.5,
    backgroundColor: C.goldLight,
    marginBottom: 20,
  },
  coverTitle: {
    fontFamily: "Cormorant",
    fontSize: 40,
    fontWeight: 700,
    color: C.white,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontFamily: "Cormorant",
    fontSize: 18,
    fontWeight: 400,
    fontStyle: "italic",
    color: C.goldLight,
    textAlign: "center",
    marginBottom: 30,
  },
  coverTagline: {
    fontFamily: "SourceSans",
    fontSize: 11,
    fontWeight: 300,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 1.7,
    maxWidth: 340,
  },
  coverUrl: {
    fontFamily: "SourceSans",
    fontSize: 9,
    fontWeight: 400,
    color: C.goldLight,
    textAlign: "center",
    marginTop: 40,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },

  // Grand Hero (260px) — Template A
  grandHeroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 260,
    objectFit: "cover" as const,
  },
  grandHeroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 260,
    backgroundColor: "rgba(31, 26, 23, 0.45)",
  },
  grandHeroTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 260,
    justifyContent: "center",
    paddingLeft: 35,
    paddingRight: 35,
  },
  contentBelowGrandHero: {
    paddingTop: 284, // 260 + 24
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 40,
  },

  // Standard Hero (170px) — Template C
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 170,
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 170,
    backgroundColor: "rgba(31, 26, 23, 0.45)",
  },
  heroTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 170,
    justifyContent: "center",
    paddingLeft: 35,
    paddingRight: 35,
  },
  heroTitle: {
    fontFamily: "Cormorant",
    fontSize: 26,
    fontWeight: 700,
    color: C.white,
    letterSpacing: 1,
    textAlign: "center",
  },
  contentBelowHero: {
    paddingTop: 194, // 170 + 24
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 40,
  },

  // Editorial Split — Template B
  splitImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: 255,
    height: "100%",
    objectFit: "cover" as const,
  },
  splitContent: {
    marginLeft: 270,
    paddingTop: 48,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 15,
  },

  // Sponsor Hero (240px) — Template F
  sponsorHeroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 240,
    objectFit: "cover" as const,
  },
  sponsorHeroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 240,
    backgroundColor: "rgba(31, 26, 23, 0.45)",
  },
  sponsorHeroTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 240,
    justifyContent: "center",
    paddingLeft: 35,
    paddingRight: 35,
  },
  contentBelowSponsorHero: {
    paddingTop: 258, // 240 + 18
    paddingLeft: 35,
    paddingRight: 35,
    paddingBottom: 20,
  },

  // Full content page (no hero) — Template D
  fullContent: {
    paddingTop: 48,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 40,
  },

  // Section intro paragraph
  sectionIntro: {
    fontFamily: "SourceSans",
    fontSize: 10.5,
    fontWeight: 400,
    fontStyle: "italic",
    color: C.caption,
    lineHeight: 1.65,
    marginBottom: 14,
  },

  // Typography
  sectionHeading: {
    fontFamily: "Cormorant",
    fontSize: 20,
    fontWeight: 700,
    color: C.burgundy,
    marginBottom: 14,
    marginTop: 0,
  },
  subHeading: {
    fontFamily: "Cormorant",
    fontSize: 13,
    fontWeight: 700,
    color: C.burgundyDark,
    marginBottom: 5,
    marginTop: 16,
  },
  body: {
    fontFamily: "SourceSans",
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.65,
    color: C.body,
  },
  bodySmall: {
    fontFamily: "SourceSans",
    fontSize: 9,
    lineHeight: 1.6,
    color: C.caption,
  },

  // Bullets
  bulletRow: {
    flexDirection: "row" as const,
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 14,
    fontFamily: "SourceSans",
    fontSize: 10,
    color: C.burgundy,
  },
  bulletText: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 10,
    lineHeight: 1.55,
    color: C.body,
  },

  // Tip / callout box
  tipBox: {
    backgroundColor: C.cream,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
    padding: 12,
    paddingLeft: 14,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 2,
  },
  tipLabel: {
    fontFamily: "CormorantSC",
    fontSize: 9,
    fontWeight: 700,
    color: C.gold,
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  tipText: {
    fontFamily: "SourceSans",
    fontSize: 9.5,
    lineHeight: 1.6,
    color: C.body,
    fontStyle: "italic",
  },

  // Pull quote
  pullQuote: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
    backgroundColor: C.cream,
    marginVertical: 14,
  },
  pullQuoteOpen: {
    fontFamily: "Cormorant",
    fontSize: 36,
    color: C.gold,
    lineHeight: 1,
    marginBottom: -8,
  },
  pullQuoteText: {
    fontFamily: "Cormorant",
    fontSize: 16,
    fontStyle: "italic",
    color: C.burgundy,
    lineHeight: 1.7,
  },

  // Comparison table
  tableHeader: {
    flexDirection: "row" as const,
    backgroundColor: C.burgundy,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 9,
    fontWeight: 600,
    color: C.white,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row" as const,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.sand,
  },
  tableRowAlt: {
    flexDirection: "row" as const,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.sand,
    backgroundColor: C.warmGray,
  },
  tableCell: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 9.5,
    color: C.body,
    lineHeight: 1.4,
  },
  tableCellLabel: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 9.5,
    fontWeight: 600,
    color: C.burgundyDark,
    lineHeight: 1.4,
  },

  // Two-column layout
  twoCol: {
    flexDirection: "row" as const,
    gap: 24,
  },
  col: {
    flex: 1,
  },

  // Inline image (within content)
  inlineImage: {
    width: "100%",
    height: 160,
    objectFit: "cover" as const,
    borderRadius: 4,
    marginVertical: 12,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: C.sand,
    marginVertical: 16,
  },

  // Gold rule divider
  goldRule: {
    width: 36,
    height: 1.5,
    backgroundColor: C.goldLight,
    marginBottom: 16,
  },

  // Footer
  footer: {
    position: "absolute" as const,
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: C.stone,
    paddingTop: 8,
  },
  footerText: {
    fontFamily: "SourceSans",
    fontSize: 7.5,
    color: C.caption,
    letterSpacing: 0.5,
  },
  pageNum: {
    fontFamily: "SourceSans",
    fontSize: 7.5,
    color: C.caption,
  },

  // Interstitial pages — Template E
  interstitialPage: {
    position: "relative" as const,
  },
  interstitialImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  interstitialOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(31, 26, 23, 0.35)",
  },
  interstitialQuoteContainer: {
    position: "absolute" as const,
    bottom: 80,
    left: 25,
    right: 25,
    alignItems: "center" as const,
  },
  interstitialQuoteRule: {
    width: 36,
    height: 1.5,
    backgroundColor: C.goldLight,
    marginBottom: 16,
  },
  interstitialQuoteText: {
    fontFamily: "Cormorant",
    fontSize: 20,
    fontStyle: "italic",
    color: C.white,
    textAlign: "center" as const,
    lineHeight: 1.7,
  },
  interstitialAttribution: {
    fontFamily: "SourceSans",
    fontSize: 9,
    fontWeight: 300,
    color: "rgba(255,255,255,0.7)",
    marginTop: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },

  // Cost comparison mini-table
  costTableHeader: {
    flexDirection: "row" as const,
    backgroundColor: C.burgundy,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  costTableHeaderCell: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 8,
    fontWeight: 600,
    color: C.white,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    textAlign: "center" as const,
  },
  costTableHeaderCellFirst: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 8,
    fontWeight: 600,
    color: C.white,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  costTableRow: {
    flexDirection: "row" as const,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.sand,
  },
  costTableRowAlt: {
    flexDirection: "row" as const,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.sand,
    backgroundColor: C.warmGray,
  },
  costTableCellLabel: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 9,
    fontWeight: 600,
    color: C.burgundyDark,
  },
  costTableCell: {
    flex: 1,
    fontFamily: "SourceSans",
    fontSize: 9,
    color: C.body,
    textAlign: "center" as const,
  },

  // Accent block
  accentBlock: {
    backgroundColor: C.cream,
    padding: 14,
    borderRadius: 4,
    marginTop: 12,
  },

  // Side-by-side photo row
  photoRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginVertical: 12,
  },
  photoRowImage: {
    flex: 1,
    height: 90,
    objectFit: "cover" as const,
    borderRadius: 4,
  },
  photoCaption: {
    fontFamily: "SourceSans",
    fontSize: 7.5,
    color: C.caption,
    textAlign: "center" as const,
    marginTop: 4,
  },

  // Sponsor page styles
  sponsorLabel: {
    fontFamily: "CormorantSC",
    fontSize: 9,
    fontWeight: 700,
    color: C.gold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  sponsorBody: {
    fontFamily: "SourceSans",
    fontSize: 10,
    lineHeight: 1.65,
    color: C.body,
    marginBottom: 14,
  },
  tastingBlock: {
    marginBottom: 6,
  },
  tastingRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
    marginBottom: 2,
  },
  tastingName: {
    fontFamily: "SourceSans",
    fontSize: 9.5,
    fontWeight: 600,
    color: C.body,
  },
  tastingPrice: {
    fontFamily: "SourceSans",
    fontSize: 9.5,
    fontWeight: 600,
    color: C.burgundy,
  },
  tastingDesc: {
    fontFamily: "SourceSans",
    fontSize: 8.5,
    color: C.caption,
    lineHeight: 1.5,
  },
  sponsorPhotoRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  sponsorPhoto: {
    flex: 1,
    height: 130,
    objectFit: "cover" as const,
    borderRadius: 4,
  },
  sponsorFooter: {
    borderTopWidth: 1,
    borderTopColor: C.sand,
    paddingTop: 10,
    alignItems: "center" as const,
  },
  sponsorGoldRule: {
    width: 36,
    height: 1.5,
    backgroundColor: C.goldLight,
    marginBottom: 10,
  },
  sponsorAddress: {
    fontFamily: "SourceSans",
    fontSize: 8.5,
    color: C.caption,
    marginBottom: 6,
  },
  sponsorLink: {
    fontFamily: "Cormorant",
    fontSize: 14,
    color: C.burgundy,
    textDecoration: "underline" as const,
    letterSpacing: 0.5,
  },
  sponsorTag: {
    fontFamily: "SourceSans",
    fontSize: 7,
    color: C.caption,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginTop: 10,
  },

  // CTA section
  ctaBanner: {
    width: "100%",
    height: 100,
    objectFit: "cover" as const,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  ctaBox: {
    backgroundColor: C.cream,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    padding: 28,
    alignItems: "center" as const,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.sand,
  },
  ctaTitle: {
    fontFamily: "Cormorant",
    fontSize: 22,
    fontWeight: 700,
    color: C.burgundy,
    textAlign: "center" as const,
    marginBottom: 10,
  },
  ctaBody: {
    fontFamily: "SourceSans",
    fontSize: 10.5,
    color: C.body,
    textAlign: "center" as const,
    lineHeight: 1.7,
    maxWidth: 380,
    marginBottom: 14,
  },
  ctaFeature: {
    fontFamily: "SourceSans",
    fontSize: 10,
    color: C.body,
    textAlign: "center" as const,
    marginBottom: 4,
  },
  ctaFeatureLast: {
    fontFamily: "SourceSans",
    fontSize: 10,
    color: C.body,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  ctaLink: {
    fontFamily: "Cormorant",
    fontSize: 13,
    color: C.burgundy,
    textDecoration: "underline" as const,
    letterSpacing: 0.5,
  },
});

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>NAPA SONOMA GUIDE</Text>
      <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} />
    </View>
  );
}

/** Standard hero (170px) — Template C */
function HeroSection({ image, title }: { image: string; title: string }) {
  return (
    <>
      <Image style={s.heroImage} src={path.join(PHOTOS, image)} />
      <View style={s.heroOverlay} />
      <View style={s.heroTextContainer}>
        <Text style={s.heroTitle}>{title}</Text>
      </View>
    </>
  );
}

/** Grand hero (260px) — Template A */
function GrandHeroSection({ image, title }: { image: string; title: string }) {
  return (
    <>
      <Image style={s.grandHeroImage} src={path.join(PHOTOS, image)} />
      <View style={s.grandHeroOverlay} />
      <View style={s.grandHeroTextContainer}>
        <Text style={s.heroTitle}>{title}</Text>
      </View>
    </>
  );
}

/** Interstitial — Template E */
function InterstitialWithQuote({ image, quote, attribution }: {
  image: string; quote: string; attribution?: string;
}) {
  return (
    <Page size="LETTER" style={s.interstitialPage}>
      <Image style={s.interstitialImage} src={path.join(PHOTOS, image)} />
      <View style={s.interstitialOverlay} />
      <View style={s.interstitialQuoteContainer}>
        <View style={s.interstitialQuoteRule} />
        <Text style={s.interstitialQuoteText}>{quote}</Text>
        {attribution && <Text style={s.interstitialAttribution}>{attribution}</Text>}
      </View>
    </Page>
  );
}

function Tip({ children }: { children: string }) {
  return (
    <View style={s.tipBox}>
      <Text style={s.tipLabel}>INSIDER TIP</Text>
      <Text style={s.tipText}>{children}</Text>
    </View>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>{"\u2022"}</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function SubHeading({ children }: { children: string }) {
  return <Text style={s.subHeading}>{children}</Text>;
}

function Body({ children }: { children: string }) {
  return <Text style={s.body}>{children}</Text>;
}

function Divider() {
  return <View style={s.divider} />;
}

function PullQuote({ children }: { children: string }) {
  return (
    <View style={s.pullQuote}>
      <Text style={s.pullQuoteOpen}>{"\u201C"}</Text>
      <Text style={s.pullQuoteText}>{children}</Text>
    </View>
  );
}

function TableRow({ cells, alt = false, header = false }: { cells: string[]; alt?: boolean; header?: boolean }) {
  if (header) {
    return (
      <View style={s.tableHeader}>
        {cells.map((c, i) => (
          <Text key={i} style={s.tableHeaderCell}>{c}</Text>
        ))}
      </View>
    );
  }
  return (
    <View style={alt ? s.tableRowAlt : s.tableRow}>
      <Text style={s.tableCellLabel}>{cells[0]}</Text>
      {cells.slice(1).map((c, i) => (
        <Text key={i} style={s.tableCell}>{c}</Text>
      ))}
    </View>
  );
}

function TastingItem({ name, price, description }: { name: string; price: string; description: string }) {
  return (
    <View style={s.tastingBlock}>
      <View style={s.tastingRow}>
        <Text style={s.tastingName}>{name}</Text>
        <Text style={s.tastingPrice}>{price}</Text>
      </View>
      <Text style={s.tastingDesc}>{description}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function WineCountryGuide() {
  return (
    <Document
      title="Napa Sonoma Guide: Wine Country Planning Guide"
      author="Napa Sonoma Guide"
      subject="A comprehensive guide to planning your Napa and Sonoma wine country trip"
    >
      {/* ================================================================= */}
      {/* 1. COVER                                                          */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.coverPage}>
        <Image style={s.coverImage} src={path.join(PHOTOS, "cover-hero.jpg")} />
        <View style={s.coverOverlay} />
        <View style={s.coverContent}>
          <View style={{ alignItems: "center" }}>
            <View style={s.coverRule} />
            <Text style={s.coverTitle}>Napa Sonoma Guide</Text>
            <Text style={s.coverSubtitle}>Your Wine Country Planning Guide</Text>
            <Text style={s.coverTagline}>
              Everything you need to plan the perfect wine country trip — from first-time visitors to seasoned collectors.
            </Text>
            <Text style={s.coverUrl}>napasonomaguide.com</Text>
          </View>
        </View>
      </Page>

      {/* ================================================================= */}
      {/* 2. BEST TIME TO VISIT — Template A (Grand Hero 260px)             */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <GrandHeroSection
          image="fall-harvest.jpg"
          title="Best Time to Visit"
        />
        <View style={s.contentBelowGrandHero}>
          <Text style={s.sectionIntro}>
            Wine country transforms with every season — mustard-carpeted vineyards in spring, golden light on harvest-day mornings, misty hillsides in winter. Each visit reveals something new, and the best time to come depends entirely on the experience you're after.
          </Text>
          <View style={s.goldRule} />

          <Body>
            Spring (March–May) is when wine country awakens. Brilliant yellow mustard flowers blanket the vineyard rows as the vines push bright green growth. Temperatures hover between 60 and 75°F — warm enough for outdoor tastings, cool enough for vineyard walks. Crowds are moderate, tasting rooms are relaxed, and you will find genuine conversation with your hosts.
          </Body>

          <Body>
            Summer (June–August) brings peak energy and peak heat, with temperatures reaching 90–100°F in Napa, though the Sonoma Coast stays cooler thanks to Pacific fog. Book well in advance and expect higher prices, but the long golden days and vibrant energy make it worth the planning.
          </Body>

          <Image
            style={{ width: "100%", height: 80, objectFit: "cover" as const, borderRadius: 4, marginVertical: 8 }}
            src={path.join(PHOTOS, "spring-vineyard-strip.jpg")}
          />

          <Body>
            Fall (September–November) is the season that defines wine country. Harvest — or "crush" — transforms every winery into a hive of activity. The air is fragrant with fermenting grapes, vineyards glow crimson and gold, and the energy is palpable. October is busiest; reserve four to six weeks ahead.
          </Body>

          <Body>
            Winter (December–February) is wine country's quiet secret. Fewer crowds, lower prices, and hillsides turned emerald green by the rains. The wineries that stay open offer intimate, unhurried tastings where the winemaker might pour for you personally.
          </Body>

          <Tip>
            Weekdays are always less crowded, regardless of season. A Tuesday through Thursday visit means shorter waits, more personal attention from tasting hosts, and a more relaxed pace.
          </Tip>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 3. WINE GLASSES INTERSTITIAL — Template E                         */}
      {/* ================================================================= */}
      <InterstitialWithQuote
        image="wine-glasses-portrait.jpg"
        quote={"\u201CWine is sunlight, held together by water.\u201D"}
        attribution="Galileo Galilei"
      />

      {/* ================================================================= */}
      {/* 4. PLANNING YOUR TASTING DAY — Template B (Editorial Split)       */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <Image style={s.splitImage} src={path.join(PHOTOS, "tasting-room.jpg")} />
        <View style={s.splitContent}>
          <Text style={s.sectionHeading}>Planning Your Tasting Day</Text>
          <Text style={s.sectionIntro}>
            The most memorable days in wine country aren't rushed — they unfold. A late morning start, a few carefully chosen stops, a long lunch somewhere with a view.
          </Text>
          <View style={s.goldRule} />

          <SubHeading>How Many Wineries</SubHeading>
          <Body>
            Plan for three to four wineries per day at most. Allow 60 to 90 minutes at each stop — enough time to savor the wines, ask questions, and soak in the setting. Build in 20 to 30 minutes of travel between wineries, and always schedule a proper lunch break. Trying to squeeze in more stops turns a leisurely day into a marathon.
          </Body>

          <SubHeading>The Ideal Day</SubHeading>
          <Bullet>9:00 AM — Breakfast: fuel up well before your first pour</Bullet>
          <Bullet>10:00 AM — First tasting at a bold-reds producer while your palate is freshest</Bullet>
          <Bullet>11:30 AM — Second tasting, perhaps a smaller boutique winery</Bullet>
          <Bullet>12:30 PM — Lunch break with a view — no wine, just rest and recharge</Bullet>
          <Bullet>2:00 PM — Third tasting, shift to lighter wines or sparkling</Bullet>
          <Bullet>3:30 PM — Optional fourth stop, or simply enjoy the scenery</Bullet>
          <Bullet>5:00 PM — Dinner reservations or a sunset drive home</Bullet>

          <SubHeading>Pro Move</SubHeading>
          <Body>
            Ask if the winery offers a vineyard walk or behind-the-scenes cellar tour — many do for small groups, especially midweek. Start with bolder wines when your palate is freshest and save sparkling and whites for the afternoon.
          </Body>

          <Tip>
            Eat a solid breakfast before your first tasting. Starting on an empty stomach leads to palate fatigue — and an early end to your day.
          </Tip>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 5. RESERVATIONS & ETIQUETTE — Template C (Standard Hero 170px)    */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <HeroSection
          image="barrel-cave.jpg"
          title="Reservations & Etiquette"
        />
        <View style={s.contentBelowHero}>
          <Text style={s.sectionIntro}>
            Behind every great tasting experience is a small bit of preparation. Napa Valley's most acclaimed estates require reservations weeks in advance, while Sonoma's tasting rooms welcome walk-ins with open arms.
          </Text>
          <View style={s.goldRule} />
          <View style={s.twoCol}>
            <View style={s.col}>
              <SubHeading>Napa Valley Reservations</SubHeading>
              <Bullet>Most wineries are appointment-only</Bullet>
              <Bullet>Peak season: reserve 2-4 weeks ahead</Bullet>
              <Bullet>Off-season: 3-7 days is usually fine</Bullet>
              <Bullet>Iconic estates may need months of lead time</Bullet>

              <SubHeading>Sonoma County</SubHeading>
              <Bullet>More walk-in friendly overall</Bullet>
              <Bullet>Weekends still benefit from reservations</Bullet>
              <Bullet>Many Sonoma Plaza tasting rooms accept walk-ins</Bullet>
            </View>
            <View style={s.col}>
              <SubHeading>Tasting Etiquette</SubHeading>
              <Bullet>Most tastings include 4-6 wines over 45-60 min</Bullet>
              <Bullet>Spitting is normal and expected — dump buckets are provided</Bullet>
              <Bullet>Ask questions — hosts love sharing their knowledge</Bullet>
              <Bullet>No strong perfume or cologne (it interferes with aroma)</Bullet>

              <SubHeading>Tipping</SubHeading>
              <Bullet>$5-10/person for complimentary tastings</Bullet>
              <Bullet>For paid tastings, tipping is welcome but less expected</Bullet>
              <Bullet>Private tours: $10-20 per person</Bullet>
            </View>
          </View>

          <Image
            style={{ width: "100%", height: 70, objectFit: "cover" as const, borderRadius: 4, marginVertical: 8 }}
            src={path.join(PHOTOS, "town-square.jpg")}
          />

          <SubHeading>Bringing Kids & Dogs</SubHeading>
          <Body>
            Many wineries welcome families and four-legged friends. Castello di Amorosa is a hit with kids — they offer grape juice and farm animals to visit. Frog's Leap is famously dog-friendly. Visit napasonomaguide.com to filter by kid-friendly and dog-friendly amenities.
          </Body>

          <Tip>
            If a winery is fully booked online, call directly. They often hold spots for phone reservations, especially midweek.
          </Tip>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 6. BUDGETING — Template C (Standard Hero 170px)                   */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <HeroSection
          image="outdoor-dining.jpg"
          title="Budgeting Your Trip"
        />
        <View style={s.contentBelowHero}>
          <Text style={s.sectionIntro}>
            A wine country getaway can be as lavish or as laid-back as you want it to be. From world-class Cabernet at a grand Napa estate to a picnic blanket with a $25 bottle in Sonoma, there's a way to experience this place at every price point.
          </Text>
          <View style={s.goldRule} />

          {/* Cost comparison mini-table */}
          <View style={{ marginBottom: 14 }}>
            <View style={s.costTableHeader}>
              <Text style={s.costTableHeaderCellFirst}>Region</Text>
              <Text style={s.costTableHeaderCell}>Tastings</Text>
              <Text style={s.costTableHeaderCell}>Bottles</Text>
              <Text style={s.costTableHeaderCell}>Dining</Text>
            </View>
            <View style={s.costTableRow}>
              <Text style={s.costTableCellLabel}>Napa</Text>
              <Text style={s.costTableCell}>$50–125+</Text>
              <Text style={s.costTableCell}>$50–200+</Text>
              <Text style={s.costTableCell}>$75–150+</Text>
            </View>
            <View style={s.costTableRowAlt}>
              <Text style={s.costTableCellLabel}>Sonoma</Text>
              <Text style={s.costTableCell}>$25–60</Text>
              <Text style={s.costTableCell}>$30–80</Text>
              <Text style={s.costTableCell}>$20–75</Text>
            </View>
          </View>

          <View style={s.twoCol}>
            <View style={s.col}>
              <SubHeading>Wine Prices at the Winery</SubHeading>
              <Bullet>Napa Cabernet: $50-$200+ per bottle</Bullet>
              <Bullet>Sonoma Pinot Noir: $30-$80 per bottle</Bullet>
              <Bullet>Whites and rosés: $20-$50 per bottle</Bullet>
              <Body>
                Winery-exclusive wines are often the best value — they are not marked up by distributors.
              </Body>

              <SubHeading>Food & Dining</SubHeading>
              <Bullet>Casual lunch: $20-$40 per person</Bullet>
              <Bullet>Fine dining: $75-$150+ per person</Bullet>
              <Bullet>Picnic from a market: $15-$25 per person</Bullet>
            </View>
            <View style={s.col}>
              <View style={s.accentBlock}>
                <SubHeading>Ways to Save</SubHeading>
                <Bullet>Visit on weekdays for occasional lower rates</Bullet>
                <Bullet>Join a wine club for free tastings and discounts</Bullet>
                <Bullet>Pack a picnic instead of dining out every meal</Bullet>
                <Bullet>Share tastings with a partner (often allowed)</Bullet>
                <Bullet>Sonoma is generally 30-50% less expensive than Napa</Bullet>
                <Bullet>Many tasting fees are waived with a wine purchase</Bullet>
                <Bullet>Look for combo passes covering 3-5 tastings at a discount</Bullet>
              </View>
            </View>
          </View>

          <Tip>
            Ask your hotel or B&B host for tasting cards and local coupons. Many accommodations partner with nearby wineries for discounted or complimentary tastings.
          </Tip>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 7. GETTING AROUND — Template C (Standard Hero 170px)              */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <HeroSection
          image="winding-road.jpg"
          title="Getting Around"
        />
        <View style={s.contentBelowHero}>
          <Text style={s.sectionIntro}>
            The winding roads between wineries are part of the experience — sunlit valleys, hilltop views, the occasional deer at the roadside. How you travel shapes what you see.
          </Text>
          <View style={s.goldRule} />
          <View style={s.twoCol}>
            <View style={s.col}>
              <SubHeading>Driving Yourself</SubHeading>
              <Bullet>Most flexible, but designate a sober driver</Bullet>
              <Bullet>Napa is ~30 miles long, most stops within 20 min</Bullet>
              <Bullet>Silverado Trail is less congested than Highway 29</Bullet>
              <Bullet>Parking is free at nearly all wineries</Bullet>

              <SubHeading>Hired Drivers & Limos</SubHeading>
              <Bullet>Sedans: $50-$100/hour</Bullet>
              <Bullet>Limos and SUVs: $100-$200+/hour</Bullet>
              <Bullet>Drivers often know great stops and hidden gems</Bullet>
              <Bullet>Typically 5-6 hour minimum; book early in peak season</Bullet>
            </View>
            <View style={s.col}>
              <SubHeading>Ride Shares</SubHeading>
              <Bullet>Uber and Lyft available but unreliable in rural areas</Bullet>
              <Bullet>Wait times of 15-30 min outside main towns</Bullet>
              <Bullet>Better as backup than primary transport</Bullet>

              <SubHeading>Biking</SubHeading>
              <Bullet>Excellent in Sonoma — Dry Creek and Russian River</Bullet>
              <Bullet>Napa Valley Vine Trail runs Calistoga to Napa</Bullet>
              <Bullet>E-bike rentals make the hills manageable</Bullet>
              <Bullet>Same moderation rules apply as driving</Bullet>
              <Bullet>Napa Valley Bike Tours offers guided routes with winery stops included</Bullet>
            </View>
          </View>

          <PullQuote>
            The best wine country road trips are the ones where you are not in a hurry. Leave room in the schedule for a detour — the unplanned stops are often the most memorable.
          </PullQuote>

          <Tip>
            Yountville is walkable to five-plus tasting rooms. Park once and explore on foot — bonus: you do not need a designated driver.
          </Tip>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 8. NAPA VS SONOMA — Template A (Grand Hero 260px)                 */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <GrandHeroSection
          image="sonoma-countryside.jpg"
          title="Napa vs. Sonoma"
        />
        <View style={s.contentBelowGrandHero}>
          <Text style={s.sectionIntro}>
            They're separated by a single mountain range and connected by a handful of scenic roads, yet Napa and Sonoma feel like different worlds. Most visitors discover they love both for entirely different reasons.
          </Text>
          <View style={s.goldRule} />

          <View style={{ marginBottom: 6 }}>
            <TableRow header cells={["", "Napa Valley", "Sonoma County"]} />
            <TableRow cells={["Vibe", "Polished, upscale, focused", "Laid-back, rustic, diverse"]} />
            <TableRow alt cells={["Tasting Fees", "$50-$125+", "$25-$60"]} />
            <TableRow cells={["Reservations", "Usually required", "Often walk-in friendly"]} />
            <TableRow alt cells={["Top Grapes", "Cabernet Sauvignon, Merlot", "Pinot Noir, Chardonnay, Zinfandel"]} />
            <TableRow cells={["Geography", "Narrow valley, concentrated", "Sprawling, coast to inland"]} />
            <TableRow alt cells={["Dining", "World-class, pricey", "Farm-to-table, moderate"]} />
            <TableRow cells={["Best For", "Special occasions, big reds", "Casual trips, variety seekers"]} />
          </View>

          {/* Side-by-side photo row */}
          <View style={{ ...s.photoRow, marginVertical: 6 }}>
            <View style={s.col}>
              <Image style={{ ...s.photoRowImage, height: 65 }} src={path.join(PHOTOS, "napa-estate.jpg")} />
              <Text style={s.photoCaption}>Napa Valley</Text>
            </View>
            <View style={s.col}>
              <Image style={{ ...s.photoRowImage, height: 65 }} src={path.join(PHOTOS, "sonoma-patio.jpg")} />
              <Text style={s.photoCaption}>Sonoma County</Text>
            </View>
          </View>

          <PullQuote>
            Napa is polished and celebratory — think milestone dinners and reserve tastings. Sonoma is where you kick off your shoes, linger on a patio, and lose track of time.
          </PullQuote>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 9. REGIONAL HIGHLIGHTS — Template D (Full Content, ivory bg)      */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.pageIvory}>
        <View style={s.fullContent}>
          <Text style={s.sectionHeading}>Regional Highlights</Text>
          <View style={s.goldRule} />
          <Text style={s.sectionIntro}>
            Napa and Sonoma aren't single destinations — they're mosaics of distinct growing regions, each with its own microclimate, terrain, and character. From the fog-cooled ridges of the Sonoma Coast to the sun-drenched benchlands of Oakville, every AVA tells a different story in the glass.
          </Text>
          <View style={s.twoCol}>
            <View style={s.col}>
              <Text style={s.sectionHeading}>Napa Valley</Text>
              <SubHeading>Oakville & Rutherford</SubHeading>
              <Body>The heart of Napa Cabernet. Rich, structured wines with the famous "Rutherford dust" terroir character.</Body>

              <SubHeading>Stags Leap District</SubHeading>
              <Body>Elegant, refined Cabernets. Home to the wineries that won the legendary 1976 Judgment of Paris.</Body>

              <SubHeading>Calistoga</SubHeading>
              <Body>Bold, full-bodied reds from the warm north end. Don't miss the hot springs after a day of tasting.</Body>

              <SubHeading>Carneros</SubHeading>
              <Body>Cool climate straddling both valleys. Known for exceptional Pinot Noir, Chardonnay, and sparkling wine.</Body>

              <SubHeading>Howell Mountain</SubHeading>
              <Body>Mountain-grown Cabernet with intense concentration. Worth the winding drive for serious wine lovers.</Body>
            </View>
            <View style={s.col}>
              <Text style={s.sectionHeading}>Sonoma County</Text>
              <SubHeading>Russian River Valley</SubHeading>
              <Body>Cool, foggy mornings produce world-class Pinot Noir and Chardonnay with elegant complexity.</Body>

              <SubHeading>Dry Creek Valley</SubHeading>
              <Body>Zinfandel heaven. Small family wineries with character, history, and genuine hospitality.</Body>

              <SubHeading>Sonoma Coast</SubHeading>
              <Body>Extreme cool-climate wines. Pinot Noir and Chardonnay with bright, thrilling acidity.</Body>

              <SubHeading>Alexander Valley</SubHeading>
              <Body>Warmer climate, excellent Cabernet. Far less crowded than Napa — a hidden gem for discovery.</Body>

              <SubHeading>Sonoma Valley</SubHeading>
              <Body>The original "Valley of the Moon." Charming towns, diverse wines, and rich winemaking history.</Body>
            </View>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 10. INSIDER TIPS — Template B (Editorial Split)                   */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.page}>
        <Image style={s.splitImage} src={path.join(PHOTOS, "charming-town.jpg")} />
        <View style={{ ...s.splitContent, paddingTop: 36, paddingBottom: 30 }}>
          <Text style={{ ...s.sectionHeading, marginBottom: 10 }}>Insider Tips</Text>
          <Text style={{ ...s.sectionIntro, marginBottom: 8 }}>
            The difference between a good trip and an unforgettable one comes down to the details only locals know.
          </Text>
          <View style={s.goldRule} />

          <Text style={{ ...s.subHeading, marginTop: 10 }}>Local Knowledge</Text>
          <Bullet>Oakville Grocery has been a Napa institution since 1881. Grab a sandwich and picnic at a nearby winery.</Bullet>
          <Bullet>Ask for the reserve or library tasting — often only $15-20 more with dramatically better wines.</Bullet>
          <Bullet>Yountville is walkable to five-plus tasting rooms. Park once and explore on foot.</Bullet>

          <Text style={{ ...s.subHeading, marginTop: 10 }}>Best Picnic Spots</Text>
          <Bullet>V. Sattui in Napa — famous deli and picnic grounds on the property</Bullet>
          <Bullet>Gundlach Bundschu in Sonoma — hillside picnic areas with vineyard views</Bullet>
          <Bullet>Stock up at Oxbow Public Market (Napa) or Sonoma Plaza farmers market</Bullet>

          <Text style={{ ...s.subHeading, marginTop: 10 }}>End on a High Note</Text>
          <Bullet>End your day at a winery with a view — Artesa, Sterling, or Hamel Estate.</Bullet>
          <Bullet>Ship wine home instead of checking it. Most wineries offer flat-rate shipping.</Bullet>

          <Text style={{ ...s.subHeading, marginTop: 10 }}>Wine Clubs: Worth It?</Text>
          <Bullet>Pros: 15-25% discounts, free tastings, member events, limited wines</Bullet>
          <Bullet>Cons: 2-4 shipments per year commitment, adds up quickly</Bullet>
          <Bullet>Only join if you love the wines — try two vintages before committing</Bullet>

          <View style={{ ...s.pullQuote, marginVertical: 10, paddingVertical: 10 }}>
            <Text style={s.pullQuoteOpen}>{"\u201C"}</Text>
            <Text style={s.pullQuoteText}>Ask where the winemakers eat. You'll discover places no guidebook covers.</Text>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ================================================================= */}
      {/* 11. WINDING ROAD INTERSTITIAL — Template E                        */}
      {/* ================================================================= */}
      <InterstitialWithQuote
        image="winding-road-portrait.jpg"
        quote={"\u201CThe journey is the destination \u2014 especially when the road winds\nthrough vineyards.\u201D"}
      />

      {/* ================================================================= */}
      {/* 12. HAMEL FAMILY WINES — Template F (Sponsor Feature)             */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.pageCream}>
        <Image style={s.sponsorHeroImage} src={path.join(PHOTOS, "hamel-estate.jpg")} />
        <View style={s.sponsorHeroOverlay} />
        <View style={s.sponsorHeroTextContainer}>
          <Text style={s.heroTitle}>Hamel Family Wines</Text>
        </View>

        <View style={s.contentBelowSponsorHero}>
          <Text style={s.sponsorLabel}>WINERY SPOTLIGHT</Text>

          <Text style={s.sponsorBody}>
            Hamel Estate is a family-owned winery that emphasizes a deep connection between wine and terroir through dry farming and Biodynamic practices. Their commitment to low-intervention winemaking allows the unique character of their volcanic hillside vineyards to shine through — one of the few certified Biodynamic vineyards in California.
          </Text>

          <View style={{ ...s.goldRule, marginBottom: 6 }} />

          <Text style={{ ...s.subHeading, marginTop: 8 }}>Tasting Experiences</Text>

          <TastingItem
            name="Estate Tasting"
            price="$95"
            description="Current releases on the terrace with panoramic Sonoma Mountain views"
          />
          <TastingItem
            name="Collectors' Tasting"
            price="$125"
            description="Library and limited wines in the estate cave with a dedicated host"
          />
          <TastingItem
            name="Chef's Experience"
            price="$200"
            description="Multi-course food and wine pairing curated by the estate chef"
          />

          {/* Winery photos */}
          <View style={{ ...s.sponsorPhotoRow, marginTop: 10 }}>
            <Image style={s.sponsorPhoto} src={path.join(PHOTOS, "hamel-winery-1.jpg")} />
            <Image style={s.sponsorPhoto} src={path.join(PHOTOS, "hamel-winery-2.jpg")} />
          </View>

          <View style={{ ...s.sponsorGoldRule, marginTop: 14 }} />
          <View style={s.sponsorFooter}>
            <Text style={s.sponsorAddress}>
              15000 Sonoma Highway, Sonoma, CA 95476
            </Text>
            <Link src="https://hamelfamilywines.com">
              <Text style={s.sponsorLink}>Book at hamelfamilywines.com</Text>
            </Link>
            <Text style={s.sponsorTag}>Featured Partner</Text>
          </View>
        </View>
      </Page>

      {/* ================================================================= */}
      {/* 13. PACKING LIST + CTA — Template D (cream bg)                    */}
      {/* ================================================================= */}
      <Page size="LETTER" style={s.pageCream}>
        <View style={s.fullContent}>
          <Text style={s.sectionHeading}>What to Pack</Text>
          <View style={s.twoCol}>
            <View style={s.col}>
              <SubHeading>What to Wear</SubHeading>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Layers — cool mornings, warm afternoons</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Comfortable walking shoes (gravel paths are common)</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Smart casual: nice jeans, sundresses, or slacks</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Light jacket for cave tours and evening dinners</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Skip the white shirt (red wine spills happen)</Text>
              </View>
            </View>
            <View style={s.col}>
              <SubHeading>What to Bring</SubHeading>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Sunscreen and sunglasses</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Cooler or insulated bag in the car for wine</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Reusable water bottle — hydrate between tastings</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Phone or notebook for tasting notes</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>Cash for tips and small purchases</Text>
              </View>
              <View style={s.bulletRow}>
                <Text style={s.bulletDot}>{"\u2022"}</Text>
                <Text style={{ ...s.bulletText, fontSize: 9 }}>A designated driver plan (decide before tasting)</Text>
              </View>
            </View>
          </View>

          <PullQuote>
            Your wine country story starts here.
          </PullQuote>

          <Divider />

          {/* CTA Section */}
          <Image style={s.ctaBanner} src={path.join(PHOTOS, "hot-air-balloon.jpg")} />
          <View style={s.ctaBox}>
            <View style={s.goldRule} />
            <Text style={s.ctaTitle}>Plan Your Trip Online</Text>
            <Text style={s.ctaBody}>
              This guide is just the beginning. Visit us online for interactive tools that make planning effortless.
            </Text>
            <Text style={s.ctaFeature}>Search 200+ wineries with detailed profiles and amenities</Text>
            <Text style={s.ctaFeature}>Build custom day trip itineraries by region</Text>
            <Text style={s.ctaFeature}>Filter by experience, price range, and wine style</Text>
            <Text style={s.ctaFeatureLast}>Get AI-powered trip recommendations for your group</Text>
            <Link src="https://napasonomaguide.com">
              <Text style={s.ctaLink}>napasonomaguide.com</Text>
            </Link>
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  );
}
