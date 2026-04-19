import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";

// Phase C: slide-variant renderer for IG Reels + carousels.
// Typography: serif nameplate (Fraunces) for eyebrows and CTA pull-quotes;
// sans (Inter) for headlines. Magazine-editorial feel, not slide-deck.
// Bottom variant retained as legacy (not used by new slide pipeline).
//
// Access: admin-only. Browser loads cards via <img> tags from /nalaadmin/social-test.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const BURGUNDY_900 = "#7a1c37";
const BURGUNDY_700 = "#ab1f43";
const CREAM_50 = "#fefdf8";
const GOLD_600 = "#c1840c";
const GOLD_700 = "#9a5f0d";
const MUTED = "#5f5647";

const FORMATS = {
  ig: { width: 1080, height: 1350, photoHeight: 860 },
  pinterest: { width: 1000, height: 1500, photoHeight: 950 },
  // 9:16 vertical for IG Reels + TikTok.
  "reel-slide": { width: 1080, height: 1920, photoHeight: 1248 },
} as const;

// IG Reels UI safe zone — bottom ~220px is covered by caption + action bar.
const REEL_OVERLAY_BOTTOM = 260;

type SlideVariant =
  | "hook"
  | "qualifier"
  | "setting"
  | "experience"
  | "unique"
  | "cta";

async function fetchGoogleFont(cssUrl: string): Promise<ArrayBuffer | null> {
  try {
    // No User-Agent — Google returns TTF by default. Setting a modern browser UA
    // causes Google to return WOFF2, which Satori cannot parse (signature wOF2 error).
    // Google splits some families into multiple @font-face blocks by unicode-range;
    // pick the LAST url which is typically the basic Latin subset.
    const css = await fetch(cssUrl).then((r) => r.text());
    const matches = Array.from(css.matchAll(/src: url\(([^)]+)\)/g));
    if (matches.length === 0) return null;
    const fontUrl = matches[matches.length - 1][1];
    return await fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  if (process.env.NODE_ENV !== "development") {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return new Response("Not Found", { status: 404 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "ig") as keyof typeof FORMATS;
    const variant = (searchParams.get("variant") ?? "bottom") as
      | "bottom"
      | "overlay";
    const slideVariant = (searchParams.get("slideVariant") ?? "hook") as SlideVariant;
    const headline = searchParams.get("headline") ?? "";
    const subtext = searchParams.get("subtext") ?? "";
    const rawTag = searchParams.get("tag") ?? "";
    const tags = rawTag
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tagLabel = tags.join(" • ");
    const image = searchParams.get("image") ?? "";
    const eyebrow = searchParams.get("eyebrow") ?? "";
    const brandMark = searchParams.get("brand") ?? "";
    const slug = searchParams.get("slug") ?? "";
    const amenities = (searchParams.get("amenities") ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const fx = Math.max(0, Math.min(100, Number(searchParams.get("fx") ?? 50)));
    const fy = Math.max(0, Math.min(100, Number(searchParams.get("fy") ?? 50)));
    const zoom = Math.max(
      1,
      Math.min(3, Number(searchParams.get("zoom") ?? 1))
    );

    const dims = FORMATS[format] ?? FORMATS.ig;
    const textHeight = dims.height - dims.photoHeight;
    const isReel = format === "reel-slide";

    // Legacy bottom-variant sizing
    const headlineSize =
      headline.length > 24 ? 58 : headline.length > 16 ? 68 : 80;

    // Load Playfair (legacy bottom variant only) from local filesystem.
    const FONT_DIR = path.resolve(process.cwd(), "planning-guide/fonts");
    const playfairBold = fs.readFileSync(
      path.join(FONT_DIR, "PlayfairDisplay-Bold.ttf")
    );
    const playfairRegular = fs.readFileSync(
      path.join(FONT_DIR, "PlayfairDisplay-Regular.ttf")
    );
    const playfairItalic = fs.readFileSync(
      path.join(FONT_DIR, "PlayfairDisplay-Italic.ttf")
    );

    // Load sans (Inter) and serif nameplate (Fraunces) via Google Fonts API.
    // Google Fonts serves optimized woff subsets that Satori handles reliably;
    // local TTF files have historically crashed Satori for this project.
    const [interBoldData, interRegularData, fraunces400, fraunces400Italic] =
      await Promise.all([
        fetchGoogleFont(
          "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap"
        ),
        fetchGoogleFont(
          "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap"
        ),
        fetchGoogleFont(
          "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400&display=swap"
        ),
        fetchGoogleFont(
          "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400&display=swap"
        ),
      ]);

    const sansFont = interBoldData ? "Inter" : "Playfair";
    const serifFont = fraunces400 ? "Fraunces" : "Playfair";

    // -------------------------------------------------------------------
    // Legacy BOTTOM variant (cream text band) — preserved for backward compat.
    // -------------------------------------------------------------------
    const bottomVariantJsx = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: CREAM_50,
          fontFamily: "Playfair",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: dims.photoHeight,
            background: BURGUNDY_900,
            overflow: "hidden",
          }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              width={dims.width}
              height={dims.photoHeight}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(${(50 - fx) * 0.6}%, ${(50 - fy) * 0.6}%) scale(${zoom})`,
              }}
            />
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: textHeight,
            padding: "56px 64px 52px 64px",
            background: CREAM_50,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 48,
              height: 2,
              background: GOLD_600,
              marginBottom: 22,
            }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: "Playfair",
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: 5,
              color: GOLD_700,
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            {tagLabel || " "}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Playfair",
              fontWeight: 700,
              fontSize: headlineSize,
              lineHeight: 1.08,
              color: BURGUNDY_900,
              marginBottom: 18,
            }}
          >
            {headline}
          </div>
          {amenities.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                marginTop: 6,
              }}
            >
              {amenities.slice(0, 6).map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    background: "rgba(193, 132, 12, 0.14)",
                    color: GOLD_700,
                    fontFamily: "Playfair",
                    fontWeight: 400,
                    fontSize: 26,
                    padding: "12px 26px",
                    borderRadius: 999,
                    letterSpacing: 2,
                    border: `1px solid ${GOLD_600}`,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          ) : subtext ? (
            <div
              style={{
                display: "flex",
                fontFamily: "Playfair",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: 30,
                color: MUTED,
              }}
            >
              {subtext}
            </div>
          ) : null}
          <div style={{ display: "flex", flex: 1 }} />
          <div
            style={{
              display: "flex",
              fontFamily: "Playfair",
              fontWeight: 400,
              fontSize: 20,
              color: BURGUNDY_700,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            napasonomaguide.com
          </div>
        </div>
      </div>
    );

    // -------------------------------------------------------------------
    // OVERLAY variant — slide-aware composition for reels + carousels.
    // Rules:
    //   - Full-bleed photo, dark-to-transparent scrim protecting the text zone.
    //   - Serif (Fraunces) reserved for eyebrow nameplates and CTA pull-quotes.
    //   - Sans (Inter Bold) for headlines.
    //   - Lower-third anchor on hook/qualifier/cta; top-left nameplate only on photo-led slides.
    //   - Reel safe-zone padding keeps copy clear of IG UI.
    // -------------------------------------------------------------------
    const padX = isReel ? 72 : 64;
    const padBottom = isReel ? REEL_OVERLAY_BOTTOM : 80;
    const padTop = isReel ? 96 : 56;

    const isPhotoLed =
      slideVariant === "setting" ||
      slideVariant === "experience" ||
      slideVariant === "unique";

    // Dynamic headline sizing per variant.
    const hookSize =
      headline.length > 42
        ? 64
        : headline.length > 30
          ? 76
          : headline.length > 18
            ? 88
            : 96;
    const qualifierSize =
      headline.length > 60
        ? 40
        : headline.length > 40
          ? 48
          : headline.length > 24
            ? 56
            : 64;
    const ctaSize =
      headline.length > 40 ? 48 : headline.length > 24 ? 56 : 68;

    // Scrim strength per variant. Photo-led slides keep scrim minimal so
    // the image carries; text-bearing slides darken the bottom.
    const scrim = isPhotoLed
      ? "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.38) 100%)"
      : slideVariant === "cta"
        ? "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.92) 100%)"
        : "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.58) 72%, rgba(0,0,0,0.88) 100%)";

    // Eyebrow styling — small serif uppercase tracked nameplate.
    const eyebrowStyle = {
      display: "flex",
      fontFamily: serifFont,
      fontWeight: 400,
      color: "rgba(254, 253, 248, 0.88)",
      textTransform: "uppercase" as const,
    };

    const overlayVariantJsx = (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          background: BURGUNDY_900,
          fontFamily: sansFont,
        }}
      >
        {/* Full-bleed photo */}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            width={dims.width}
            height={dims.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${(50 - fx) * 0.6}%, ${(50 - fy) * 0.6}%) scale(${zoom})`,
            }}
          />
        ) : null}

        {/* Scrim */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: scrim,
          }}
        />

        {/* ---------- HOOK ---------- */}
        {slideVariant === "hook" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: padX,
              right: padX,
              bottom: padBottom,
              maxWidth: dims.width - padX * 2,
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  ...eyebrowStyle,
                  fontSize: isReel ? 28 : 24,
                  letterSpacing: isReel ? 5 : 4,
                  marginBottom: isReel ? 24 : 18,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontWeight: 700,
                fontSize: hookSize,
                lineHeight: 1.08,
                color: CREAM_50,
                letterSpacing: -0.5,
              }}
            >
              {headline}
            </div>
          </div>
        ) : null}

        {/* ---------- QUALIFIER ---------- */}
        {slideVariant === "qualifier" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: padX,
              right: padX,
              bottom: padBottom,
              maxWidth: dims.width - padX * 2,
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  ...eyebrowStyle,
                  fontSize: isReel ? 26 : 22,
                  letterSpacing: isReel ? 4 : 3,
                  marginBottom: isReel ? 22 : 16,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontWeight: 700,
                fontSize: qualifierSize,
                lineHeight: 1.2,
                color: CREAM_50,
                letterSpacing: -0.3,
                marginBottom: subtext ? 16 : 0,
              }}
            >
              {headline}
            </div>
            {subtext ? (
              <div
                style={{
                  display: "flex",
                  fontWeight: 400,
                  fontSize: isReel ? 30 : 26,
                  lineHeight: 1.4,
                  color: "rgba(254, 253, 248, 0.82)",
                }}
              >
                {subtext}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ---------- SETTING / EXPERIENCE / UNIQUE (photo-led) ---------- */}
        {isPhotoLed && eyebrow ? (
          <div
            style={{
              ...eyebrowStyle,
              position: "absolute",
              top: padTop,
              left: padX,
              fontSize: isReel ? 24 : 20,
              letterSpacing: isReel ? 5 : 4,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        {/* Optional pulled detail on photo-led slides — small italic caption
            bottom-left above safe zone. Set via `headline` when variant is
            setting/experience/unique. */}
        {isPhotoLed && headline ? (
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: padX,
              right: padX,
              bottom: padBottom,
              maxWidth: dims.width - padX * 2,
              fontFamily: serifFont,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: isReel ? 36 : 30,
              lineHeight: 1.3,
              color: "rgba(254, 253, 248, 0.92)",
            }}
          >
            {headline}
          </div>
        ) : null}

        {/* ---------- CTA ---------- */}
        {slideVariant === "cta" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: padX,
              right: padX,
              bottom: padBottom,
              maxWidth: dims.width - padX * 2,
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: serifFont,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: isReel ? 40 : 34,
                  lineHeight: 1.25,
                  color: "rgba(254, 253, 248, 0.92)",
                  marginBottom: isReel ? 36 : 28,
                  maxWidth: dims.width - padX * 2 - 60,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontWeight: 700,
                fontSize: ctaSize,
                lineHeight: 1.1,
                color: CREAM_50,
                letterSpacing: -0.4,
                marginBottom: isReel ? 28 : 20,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: sansFont,
                fontWeight: 400,
                fontSize: isReel ? 30 : 26,
                color: "rgba(254, 253, 248, 0.82)",
                letterSpacing: 2,
              }}
            >
              napasonomaguide.com{slug ? `/${slug}` : ""}
            </div>
          </div>
        ) : null}

        {/* Optional explicit brand mark override (legacy) */}
        {brandMark === "top" && slideVariant !== "cta" ? (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: padTop,
              right: padX,
              fontFamily: serifFont,
              fontWeight: 400,
              fontSize: 20,
              color: "rgba(254, 253, 248, 0.72)",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            napasonomaguide.com
          </div>
        ) : null}
      </div>
    );

    const fonts = [
      {
        name: "Playfair",
        data: playfairBold,
        style: "normal" as const,
        weight: 700 as const,
      },
      {
        name: "Playfair",
        data: playfairRegular,
        style: "normal" as const,
        weight: 400 as const,
      },
      {
        name: "Playfair",
        data: playfairItalic,
        style: "italic" as const,
        weight: 400 as const,
      },
      ...(interBoldData
        ? [
            {
              name: "Inter",
              data: interBoldData,
              style: "normal" as const,
              weight: 700 as const,
            },
          ]
        : []),
      ...(interRegularData
        ? [
            {
              name: "Inter",
              data: interRegularData,
              style: "normal" as const,
              weight: 400 as const,
            },
          ]
        : []),
      ...(fraunces400
        ? [
            {
              name: "Fraunces",
              data: fraunces400,
              style: "normal" as const,
              weight: 400 as const,
            },
          ]
        : []),
      ...(fraunces400Italic
        ? [
            {
              name: "Fraunces",
              data: fraunces400Italic,
              style: "italic" as const,
              weight: 400 as const,
            },
          ]
        : []),
    ];

    return new ImageResponse(
      variant === "overlay" ? overlayVariantJsx : bottomVariantJsx,
      {
        width: dims.width,
        height: dims.height,
        fonts,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack}`
        : String(err);
    return new Response(msg, { status: 500 });
  }
}
