/**
 * Amenity Audit v3 — Playwright headless browser + holistic LLM classification.
 *
 * Fixes from v2:
 * - Playwright renders JS (Shopify/Squarespace sites now readable)
 * - Expanded FAQ URL patterns (including /pages/ prefix)
 * - Context-aware quote extraction (which section/heading)
 * - Holistic classification (all quotes for a topic classified together)
 * - Full table report with every quote and source for every listing
 *
 * Usage:
 *   npx tsx scripts/audit-amenities-v3.ts                              # all
 *   npx tsx scripts/audit-amenities-v3.ts --type=wineries              # wineries only
 *   npx tsx scripts/audit-amenities-v3.ts --slugs=sterling-vineyards   # test
 *   npx tsx scripts/audit-amenities-v3.ts --dry-run                    # count only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { writeFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { accommodations } from "../src/db/schema/accommodations";
import { isNotNull } from "drizzle-orm";
import OpenAI from "openai";
import { chromium, type Browser, type Page } from "playwright";

// --- CLI ---
const dryRun = process.argv.includes("--dry-run");
const typeFilter = process.argv.find((a) => a.startsWith("--type="))?.split("=")[1];
const slugsArg = process.argv.find((a) => a.startsWith("--slugs="))?.split("=")[1];
const slugFilter = slugsArg ? slugsArg.split(",") : null;

// --- DB ---
const dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// --- OpenAI ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Constants ---
const PAGE_TIMEOUT_MS = 15000;
const DELAY_BETWEEN_PAGES_MS = 500;
const MAX_TEXT_CHARS = 10000;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// --- Playwright page fetching ---
async function fetchRenderedText(page: Page, url: string): Promise<string | null> {
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
    if (!response || response.status() >= 400) return null;

    // Wait a bit for JS to render
    await page.waitForTimeout(2000);

    // Extract ALL text including CSS-hidden content (accordion answers, collapsed FAQs)
    // Use innerHTML stripped of tags instead of innerText, which respects CSS visibility
    const text = await page.evaluate(() => {
      // Remove elements that add noise
      const remove = document.querySelectorAll("script, style, nav, footer, header, .cookie-banner, .popup, .modal");
      remove.forEach((el) => el.remove());
      const html = document.body?.innerHTML || "";
      return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#?\w+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });

    return text.replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

function extractLinksFromText(page: Page, baseUrl: string, patterns: RegExp): Promise<string[]> {
  return page.evaluate(({ baseOrigin, patternSource, patternFlags }) => {
    const pattern = new RegExp(patternSource, patternFlags);
    const links: string[] = [];
    const seen = new Set<string>();
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      if (!href || !href.startsWith(baseOrigin)) return;
      if (!pattern.test(href)) return;
      if (/\.(jpg|jpeg|png|gif|svg|pdf|css|js|webp)(\?|$)/i.test(href)) return;
      const normalized = href.split("?")[0].split("#")[0].replace(/\/$/, "");
      if (seen.has(normalized)) return;
      seen.add(normalized);
      links.push(href);
    });
    return links.slice(0, 5);
  }, { baseOrigin: new URL(baseUrl).origin, patternSource: patterns.source, patternFlags: patterns.flags });
}

// --- Quote extraction via GPT-4o-mini ---
const EXTRACT_PROMPT = `Extract exact quotes from this winery/hotel webpage about these topics. Quote the EXACT text, do not paraphrase.

For each quote, capture:
- "quote": the exact text
- "context": the section heading, experience name, or page area this appears under
- "scope": one of "property-wide", "experience-specific", or "event-specific"
  - "property-wide" = general visitor policy, FAQ answer about all visits, or default rules
  - "experience-specific" = rule that applies only to a named tasting experience (e.g., "Reserve Tasting is 21+")
  - "event-specific" = rule for a specific dated event (e.g., "Holiday Dinner — no children")

This distinction is CRITICAL. A rule like "This event is 21+" or "no pets at our Wine Dinner" is event-specific, NOT a blanket property policy. Only quotes that clearly apply to ALL visits or the GENERAL visitor policy should be "property-wide".

Topics:
- DOGS/PETS: dogs, pets, leash, four-legged, fur friends, service animals, no pets, canine, pup
- CHILDREN/KIDS: children, kids, family welcome, minors, infants, babies, 21+ visitor policy, adults only, all ages, strollers
  IMPORTANT: IGNORE standard alcohol website age gates ("must be 21 to enter this website"). Only quote VISITOR POLICIES about physical visits.
- PICNIC: picnic, bring your own food, outside food, outdoor dining areas
- SUSTAINABLE: organic, biodynamic, dry farming, sustainable, regenerative, solar, Napa Green, LEED, certified

Respond with ONLY valid JSON:
{
  "dogs": [{"quote": "exact text", "context": "section or heading", "scope": "property-wide|experience-specific|event-specific"}],
  "kids": [{"quote": "exact text", "context": "section or heading", "scope": "property-wide|experience-specific|event-specific"}],
  "picnic": [{"quote": "exact text", "context": "section or heading", "scope": "property-wide|experience-specific|event-specific"}],
  "sustainable": [{"quote": "exact text", "context": "section or heading", "scope": "property-wide|experience-specific|event-specific"}]
}

Empty arrays for topics with no mentions. Keep quotes under 150 chars each.`;

interface ExtractedQuote {
  quote: string;
  context: string;
  scope?: "property-wide" | "experience-specific" | "event-specific";
}

interface ExtractedQuotes {
  dogs: ExtractedQuote[];
  kids: ExtractedQuote[];
  picnic: ExtractedQuote[];
  sustainable: ExtractedQuote[];
}

async function extractQuotes(text: string): Promise<ExtractedQuotes | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 800,
      messages: [
        { role: "system", content: EXTRACT_PROMPT },
        { role: "user", content: text.slice(0, MAX_TEXT_CHARS) },
      ],
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr) as ExtractedQuotes;
  } catch (e) {
    console.error(`  Extract error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// --- Holistic classification via LLM ---
const CLASSIFY_PROMPT = `You are determining a winery/hotel's OVERALL policy based on ALL quotes collected from their website.

Each quote has a "scope" field: "property-wide", "experience-specific", or "event-specific".
- Property-wide quotes describe general visitor policy.
- Experience-specific quotes apply only to a named tasting or tour.
- Event-specific quotes apply to a dated event.

CRITICAL RULES FOR CLASSIFICATION:
1. Property-wide quotes carry the most weight.
2. An event-specific restriction (e.g., "This holiday dinner is 21+") does NOT mean the property bans children — it means that ONE event does.
3. If one experience bans dogs/kids but another allows them, the OVERALL policy is WELCOME (with conditions).
4. "No [dogs/kids] indoors" + "allowed outdoors" = WELCOME, not a ban. Many wineries allow dogs/kids outdoors only.
5. "No [dogs/kids] at [specific experience name]" alone is NOT a blanket ban.

For each topic, classify the OVERALL policy as one of:

DOGS:
- WELCOME: Property welcomes regular pet dogs in at least one area (outdoors, patio, garden, specific tasting). "Dogs on leash outdoors" = WELCOME. "Dogs at outdoor tastings only" = WELCOME.
- CONDITIONAL: Dogs allowed with specific restrictions (fee, size limit, breed limit, designated rooms only) — still positive.
- SERVICE_ONLY: The ONLY mention of animals is service dogs or ADA-required animals. No mention of welcoming regular pet dogs anywhere. "Only animals that satisfy ADA requirements" without any other dog-friendly language = SERVICE_ONLY, not WELCOME.
- BLANKET_BAN: Property explicitly says no pets / not pet-friendly as a whole-property policy, with no exceptions for any area.
- NO_INFO: No relevant information found.

CRITICAL for DOGS: "Not permitted indoors" + "welcome outdoors/on patio/leashed on property" = WELCOME. Focus on whether regular pet dogs can visit AT ALL, not whether they can go everywhere. But "only service animals" or "only ADA animals" with NO mention of regular dogs being welcome = SERVICE_ONLY.

KIDS:
- WELCOME: Property welcomes children/families at one or more experiences or areas. Even if SOME experiences are 21+, if ANY regular experience or area welcomes children, classify as WELCOME.
- AGE_MINIMUM: Children above a certain age welcome (e.g., 12+). Still positive.
- BLANKET_BAN: The property as a whole requires all visitors to be 21+, no children/infants anywhere on property, explicitly adults-only with NO family-friendly alternative.
- NO_INFO: No relevant info, or only website age gates found.

CRITICAL for KIDS: Many wineries have BOTH adults-only experiences AND family-friendly experiences. "21+ for [specific experience]" alongside "families welcome" or "children allowed at [other experience]" = WELCOME. Only classify as BLANKET_BAN if EVERY experience and area on the property is 21+ with zero family-friendly options.

CRITICAL SCOPE RULE FOR ALL TOPICS: If the ONLY evidence is one or more event-specific or experience-specific quotes (scope: "event-specific" or "experience-specific"), and there are NO property-wide quotes, you MUST classify as NO_INFO — not BLANKET_BAN, not WELCOME. A single event saying "21+ for this dinner" or "no pets at this event" tells you nothing about the property's general policy. Do NOT escalate event-specific restrictions to property-wide conclusions.

PICNIC:
- WELCOME: Guests can bring their own food to eat outdoors. Picnic tables/grounds available for visitor-brought food.
- FOOD_SERVICE: No outside food allowed, but property sells food. This is NOT picnic-friendly — picnic means bringing your own food.
- BLANKET_BAN: No picnicking, no outside food allowed.
- NO_INFO: No relevant info.

SUSTAINABLE:
- CERTIFIED: Specific certification (Napa Green, CCOF organic, LEED).
- PRACTICING: Specific practices (organic farming, dry farming, biodynamic, solar).
- VAGUE: Generic sustainability language without specifics.
- NO_INFO: No relevant info.

Respond with ONLY valid JSON:
{
  "dogs": {"overall": "WELCOME|CONDITIONAL|SERVICE_ONLY|BLANKET_BAN|NO_INFO", "reasoning": "brief explanation citing specific quotes and their scope"},
  "kids": {"overall": "WELCOME|AGE_MINIMUM|BLANKET_BAN|NO_INFO", "reasoning": "brief explanation citing specific quotes and their scope"},
  "picnic": {"overall": "WELCOME|FOOD_SERVICE|BLANKET_BAN|NO_INFO", "reasoning": "brief explanation"},
  "sustainable": {"overall": "CERTIFIED|PRACTICING|VAGUE|NO_INFO", "reasoning": "brief explanation"}
}`;

interface ClassificationResult {
  dogs: { overall: string; reasoning: string };
  kids: { overall: string; reasoning: string };
  picnic: { overall: string; reasoning: string };
  sustainable: { overall: string; reasoning: string };
}

async function classifyAllQuotes(
  name: string,
  allQuotes: ExtractedQuotes,
): Promise<ClassificationResult | null> {
  const formatQuote = (q: ExtractedQuote) => {
    const scope = q.scope || "unknown";
    return `- "${q.quote}" (context: ${q.context}, scope: ${scope})`;
  };
  const userContent = `Property: ${name}

Dog/pet quotes from their website:
${allQuotes.dogs.map(formatQuote).join("\n") || "None found"}

Kid/family quotes from their website:
${allQuotes.kids.map(formatQuote).join("\n") || "None found"}

Picnic quotes from their website:
${allQuotes.picnic.map(formatQuote).join("\n") || "None found"}

Sustainable quotes from their website:
${allQuotes.sustainable.map(formatQuote).join("\n") || "None found"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 600,
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        { role: "user", content: userContent },
      ],
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr) as ClassificationResult;
  } catch (e) {
    console.error(`  Classify error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// --- Map classification to boolean + confidence ---
type Confidence = "high" | "medium" | "low";

function mapDog(overall: string): { value: boolean; confidence: Confidence } {
  switch (overall) {
    case "WELCOME": case "CONDITIONAL": return { value: true, confidence: "high" };
    case "SERVICE_ONLY": case "BLANKET_BAN": return { value: false, confidence: "high" };
    default: return { value: false, confidence: "low" };
  }
}

function mapKid(overall: string): { value: boolean; confidence: Confidence } {
  switch (overall) {
    case "WELCOME": case "AGE_MINIMUM": return { value: true, confidence: "high" };
    case "BLANKET_BAN": return { value: false, confidence: "high" };
    default: return { value: false, confidence: "low" };
  }
}

function mapPicnic(overall: string, quotes: { quote: string }[]): { value: boolean; confidence: Confidence } {
  switch (overall) {
    case "WELCOME": return { value: true, confidence: "high" };
    case "FOOD_SERVICE": {
      // Only true if the site literally uses the word "picnic" (e.g., "picnic grounds")
      const mentionsPicnic = quotes.some(q => q.quote.toLowerCase().includes("picnic"));
      return mentionsPicnic ? { value: true, confidence: "medium" } : { value: false, confidence: "high" };
    }
    case "BLANKET_BAN": return { value: false, confidence: "high" };
    default: return { value: false, confidence: "low" };
  }
}

function mapSustainable(overall: string): { value: boolean; confidence: Confidence } {
  switch (overall) {
    case "CERTIFIED": case "PRACTICING": return { value: true, confidence: "high" };
    case "VAGUE": return { value: true, confidence: "medium" };
    default: return { value: false, confidence: "low" };
  }
}

// --- Page discovery ---
const FAQ_PATHS = [
  "/faq", "/faqs", "/pages/faq", "/pages/faqs",
  "/pages/visit-faq", "/pages/frequently-asked-questions",
  "/visit/faq", "/visit-us/faq", "/frequently-asked-questions",
  "/guest-policies", "/guest-policy", "/policies", "/pages/policies",
  "/visitor-information", "/plan-your-visit/faq",
  "/visit/visitation-protocols", "/visit/visitor-policies", "/visit/policies",
  "/visitor-policies", "/visitation-protocols",
  // Accommodation-specific (expanded 2026-04-10)
  "/hotel-policies", "/house-rules", "/about/policies", "/about/faq",
  "/stay/policies", "/stay/faq", "/guest-information",
  "/contact-and-directions", // Ledson Hotel uses this for policies
  "/bookings", // SingleThread hosts policies on booking page
  "/expectations", // Sonoma Bungalows
  "/pricing-and-faq", // Ranch at Lake Sonoma
  "/tasting-policy", // Cakebread
];
const VISIT_PATHS = ["/visit", "/visit-us", "/plan-your-visit", "/experiences", "/tastings"];
const DOG_PATHS = [
  "/dog-friendly", "/pet-friendly", "/pets", "/pet-policy", "/dogs", "/animals",
  "/pages/pet-policy", "/pages/dog-friendly",
  // Accommodation-specific
  "/stay/pet-friendly", "/rooms/pet-friendly", "/pages/pet-friendly",
  "/pups-welcome", // Archer Hotel
  "/dog-policy", "/hotel/dog-policy", "/information/dog-policy", // h2hotel/harmon/healdsburg style
  "/napa/pups-welcome", // Archer Hotel full path
];
const KID_PATHS = ["/family-friendly", "/family-friendly-wineries", "/families", "/family", "/kids", "/children", "/pages/family", "/pages/families"];
const SUSTAINABLE_PATHS = ["/sustainability", "/sustainable", "/napa-green", "/organic", "/farming", "/globally-responsible", "/pages/sustainability"];
const KEYWORD_PATTERNS = {
  dogs: /pet|dog|animal|canine|fur|pup/i,
  kids: /family|kid|child|children|infant/i,
  picnic: /picnic|food|dining/i,
  sustainable: /sustain|organic|farm|green|biodynamic/i,
};

interface PageData {
  url: string;
  quotes: ExtractedQuotes;
  rawText: string; // stored for second-pass re-extraction
}

// --- Second-pass focused extraction ---
// If a flag has no quotes after first pass, re-extract from the same pages
// with a more targeted prompt specifically for the missing topic
async function extractFocused(text: string, topic: "dogs" | "kids" | "picnic" | "sustainable"): Promise<ExtractedQuote[]> {
  const scopeInstr = `For "scope": use "property-wide" if the quote is a general visitor policy or FAQ answer, "experience-specific" if it applies to a named tasting/tour, or "event-specific" if it applies to a dated event.`;
  const prompts: Record<string, string> = {
    dogs: `Search this text VERY carefully for ANY mention of dogs, pets, animals, leash, four-legged, fur friends, canine, pups, service animals, pet policy, pet fee, "no pets". Look for FAQ answers, policy sections, or any sentence that mentions pets. Quote the EXACT text. ${scopeInstr} Respond with JSON: [{"quote": "exact text", "context": "section heading", "scope": "property-wide|experience-specific|event-specific"}]. Empty array if truly nothing found.`,
    kids: `Search this text VERY carefully for ANY mention of children, kids, family, families, infants, babies, minors, strollers, 21+ visitor requirement, "adults only", "all ages", "family friendly". Look especially for FAQ answers about children, age policies, or family experiences. IGNORE website age gates ("must be 21 to enter this site"). Quote the EXACT text. ${scopeInstr} Respond with JSON: [{"quote": "exact text", "context": "section heading", "scope": "property-wide|experience-specific|event-specific"}]. Empty array if truly nothing found.`,
    picnic: `Search this text VERY carefully for ANY mention of picnic, outside food, bring your own food, outdoor dining, lawn seating, food & wine pairing outdoors. Quote the EXACT text. ${scopeInstr} Respond with JSON: [{"quote": "exact text", "context": "section heading", "scope": "property-wide|experience-specific|event-specific"}]. Empty array if truly nothing found.`,
    sustainable: `Search this text VERY carefully for ANY mention of organic, biodynamic, dry farming, sustainable, regenerative, solar, Napa Green, LEED, certified, environmental, carbon footprint. Quote the EXACT text. ${scopeInstr} Respond with JSON: [{"quote": "exact text", "context": "section heading", "scope": "property-wide|experience-specific|event-specific"}]. Empty array if truly nothing found.`,
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1, // slight temperature to get different extraction
      max_tokens: 400,
      messages: [
        { role: "system", content: prompts[topic] },
        { role: "user", content: text.slice(0, MAX_TEXT_CHARS) },
      ],
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return [];
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeQuotes(quoteSets: ExtractedQuotes[]): ExtractedQuotes {
  const merged: ExtractedQuotes = { dogs: [], kids: [], picnic: [], sustainable: [] };
  for (const qs of quoteSets) {
    for (const key of ["dogs", "kids", "picnic", "sustainable"] as const) {
      for (const q of qs[key]) {
        if (!merged[key].some((m) => m.quote === q.quote)) merged[key].push(q);
      }
    }
  }
  return merged;
}

function hasUsefulQuotes(quotes: ExtractedQuotes): { dogs: boolean; kids: boolean; picnic: boolean; sustainable: boolean } {
  return {
    dogs: quotes.dogs.length > 0,
    kids: quotes.kids.some((q) => !isAgeGateQuote(q.quote)),
    picnic: quotes.picnic.length > 0,
    sustainable: quotes.sustainable.length > 0,
  };
}

function isAgeGateQuote(quote: string): boolean {
  const lower = quote.toLowerCase();
  return ["legal drinking age", "by entering this site", "by entering this website",
    "this site is intended for", "you affirm that you are of legal",
    "must be 21 to purchase", "must be 21 to consume"].some((p) => lower.includes(p));
}

async function discoverAndFetchPages(
  browserPage: Page,
  websiteUrl: string,
  entityType: "winery" | "accommodation" = "winery",
  slug?: string,
  name?: string
): Promise<PageData[]> {
  const pages: PageData[] = [];
  let baseUrl: string;
  try { baseUrl = new URL(websiteUrl).origin; } catch { return []; }

  const tried = new Set<string>();

  async function tryPage(url: string): Promise<boolean> {
    const normalized = url.replace(/\/$/, "");
    if (tried.has(normalized)) return false;
    tried.add(normalized);

    await sleep(DELAY_BETWEEN_PAGES_MS);
    const text = await fetchRenderedText(browserPage, url);
    if (!text || text.length < 100) return false;

    // Run 3 extraction passes and merge results for better coverage
    const allPassQuotes: ExtractedQuotes[] = [];
    for (let pass = 0; pass < 3; pass++) {
      const quotes = await extractQuotes(text);
      if (quotes) allPassQuotes.push(quotes);
    }

    if (allPassQuotes.length > 0) {
      const merged = mergeQuotes(allPassQuotes);
      pages.push({ url, quotes: merged, rawText: text });
    }
    return allPassQuotes.length > 0;
  }

  // Round 1: ALL FAQ/policy pages (don't break — /faq and /faqs can be different pages)
  for (const path of FAQ_PATHS) {
    await tryPage(baseUrl + path);
  }

  // Round 1.5: ExploreTock FAQ (wineries only) — ~30% of wineries host their FAQ
  // there instead of their own site. Try several slug variants since Tock URLs
  // don't always match our database slug exactly.
  if (entityType === "winery" && (slug || name)) {
    const variants = new Set<string>();
    if (slug) {
      variants.add(slug);
      variants.add(slug.replace(/-/g, ""));
      // Strip common suffixes like "-winery", "-vineyards", "-family"
      variants.add(slug.replace(/-(winery|vineyards?|family|cellars?|estate)(-.*)?$/, ""));
    }
    if (name) {
      variants.add(name.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      variants.add(name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]+/g, ""));
    }
    for (const v of variants) {
      if (!v) continue;
      await tryPage(`https://www.exploretock.com/${v}/faq`);
      await tryPage(`https://www.exploretock.com/${v}`);
    }
  }

  // Round 2: ALL visit pages
  for (const path of VISIT_PATHS) {
    await tryPage(baseUrl + path);
  }

  // Round 2.5: Scan homepage nav/footer for FAQ links (catches custom patterns like /hall-faq)
  await sleep(DELAY_BETWEEN_PAGES_MS);
  const navResponse = await browserPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS }).catch(() => null);
  if (navResponse && navResponse.status() < 400) {
    await browserPage.waitForTimeout(2000);
    // Find links with "faq" or "policies" in URL or link text
    const faqLinks = await browserPage.evaluate(({ origin }) => {
      const links: string[] = [];
      const seen = new Set<string>();
      document.querySelectorAll("a[href]").forEach((a) => {
        const el = a as HTMLAnchorElement;
        const href = el.href;
        const text = el.textContent?.toLowerCase() || "";
        if (!href.startsWith(origin)) return;
        const urlLower = href.toLowerCase();
        if (urlLower.includes("faq") || urlLower.includes("policies") || urlLower.includes("guest-polic") ||
            text.includes("faq") || text.includes("frequently asked") || text.includes("policies")) {
          const normalized = href.split("?")[0].split("#")[0].replace(/\/$/, "");
          if (!seen.has(normalized)) {
            seen.add(normalized);
            links.push(href);
          }
        }
      });
      return links;
    }, { origin: baseUrl });

    for (const link of faqLinks.slice(0, 3)) {
      await tryPage(link);
    }
  }

  // Check what needs more evidence
  let allQuotes = mergeQuotes(pages.map((p) => p.quotes));
  let needs = hasUsefulQuotes(allQuotes);

  // Round 3: Direct amenity paths for missing flags (try all, don't break)
  if (!needs.dogs) {
    for (const path of DOG_PATHS) { await tryPage(baseUrl + path); }
  }
  if (!needs.kids) {
    for (const path of KID_PATHS) { await tryPage(baseUrl + path); }
  }
  if (!needs.sustainable) {
    for (const path of SUSTAINABLE_PATHS) { await tryPage(baseUrl + path); }
  }

  // Re-check
  allQuotes = mergeQuotes(pages.map((p) => p.quotes));
  needs = hasUsefulQuotes(allQuotes);

  // Round 4: Keyword links from rendered homepage
  if (!needs.dogs || !needs.kids || !needs.picnic || !needs.sustainable) {
    await sleep(DELAY_BETWEEN_PAGES_MS);
    const homeResponse = await browserPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS }).catch(() => null);
    if (homeResponse && homeResponse.status() < 400) {
      await browserPage.waitForTimeout(2000);

      // Extract text from homepage if not already done
      if (!tried.has(baseUrl.replace(/\/$/, ""))) {
        tried.add(baseUrl.replace(/\/$/, ""));
        const homeText = await browserPage.evaluate(() => {
          const remove = document.querySelectorAll("script, style, nav, footer, header");
          remove.forEach((el) => el.remove());
          return document.body?.innerText || "";
        });
        if (homeText.length > 100) {
          const cleanedText = homeText.replace(/\s+/g, " ").trim();
          const quotes = await extractQuotes(cleanedText);
          if (quotes) pages.push({ url: baseUrl, quotes, rawText: cleanedText });
        }
      }

      // Find keyword-matched links
      const patterns: RegExp[] = [];
      if (!needs.dogs) patterns.push(KEYWORD_PATTERNS.dogs);
      if (!needs.kids) patterns.push(KEYWORD_PATTERNS.kids);
      if (!needs.sustainable) patterns.push(KEYWORD_PATTERNS.sustainable);

      if (patterns.length > 0) {
        const combinedPattern = new RegExp(patterns.map((p) => p.source).join("|"), "i");
        const subLinks = await extractLinksFromText(browserPage, baseUrl, combinedPattern);
        for (const link of subLinks.slice(0, 3)) {
          await tryPage(link);
        }
      }
    }
  }

  // --- SECOND PASS: Re-extract for missing flags ---
  // Combine all raw text from fetched pages
  allQuotes = mergeQuotes(pages.map((p) => p.quotes));
  needs = hasUsefulQuotes(allQuotes);
  const missingFlags: ("dogs" | "kids" | "picnic" | "sustainable")[] = [];
  if (!needs.dogs) missingFlags.push("dogs");
  if (!needs.kids) missingFlags.push("kids");
  if (!needs.picnic) missingFlags.push("picnic");
  if (!needs.sustainable) missingFlags.push("sustainable");

  if (missingFlags.length > 0 && pages.length > 0) {
    // Combine text from the most content-rich pages (FAQ and visit pages first)
    const combinedText = pages
      .sort((a, b) => {
        // Prioritize FAQ pages, then visit pages
        const aFaq = a.url.toLowerCase().includes("faq") ? 0 : 1;
        const bFaq = b.url.toLowerCase().includes("faq") ? 0 : 1;
        return aFaq - bFaq || b.rawText.length - a.rawText.length;
      })
      .map((p) => p.rawText)
      .join("\n\n---\n\n");

    for (const topic of missingFlags) {
      const newQuotes = await extractFocused(combinedText, topic);
      if (newQuotes.length > 0) {
        // Find which page the quote likely came from
        const bestPage = pages.find((p) =>
          newQuotes.some((q) => p.rawText.toLowerCase().includes(q.quote.toLowerCase().slice(0, 30)))
        ) || pages[0];

        for (const q of newQuotes) {
          if (!pages.some((p) => p.quotes[topic].some((eq) => eq.quote === q.quote))) {
            bestPage.quotes[topic].push(q);
          }
        }
      }
    }
  }

  return pages;
}

// --- Types ---
interface FlagResult {
  value: boolean;
  confidence: Confidence;
  overall: string;
  reasoning: string;
  quotes: { quote: string; context: string; sourceUrl: string }[];
}

interface AuditEntry {
  type: "winery" | "accommodation";
  id: number;
  slug: string;
  name: string;
  websiteUrl: string;
  pagesChecked: string[];
  siteReachable: boolean;
  flags: {
    dogFriendly: FlagResult;
    kidFriendly: FlagResult;
    picnicFriendly: FlagResult;
    sustainable: FlagResult;
  };
  currentDb: {
    dogFriendly: boolean;
    kidFriendly: boolean;
    picnicFriendly: boolean;
    sustainable: boolean;
  };
}

function emptyResult(): FlagResult {
  return { value: false, confidence: "low", overall: "NO_INFO", reasoning: "No evidence found", quotes: [] };
}

// --- Report generation ---
function generateReport(entries: AuditEntry[]): string {
  const lines: string[] = [];
  lines.push(`# Amenity Audit v3 — Full Report (${new Date().toISOString().split("T")[0]})\n`);

  // Summary
  let corrections = 0, additions = 0, removals = 0, confirmed = 0;
  for (const e of entries) {
    for (const [flag, result] of Object.entries(e.flags)) {
      const current = e.currentDb[flag as keyof typeof e.currentDb];
      if (result.confidence === "low") { if (current) removals++; else confirmed++; }
      else if (result.value === current) confirmed++;
      else if (result.value && !current) additions++;
      else corrections++;
    }
  }

  const unreachable = entries.filter((e) => !e.siteReachable);
  lines.push("## Summary");
  lines.push(`- Listings: ${entries.length} (${entries.length - unreachable.length} reachable, ${unreachable.length} unreachable)`);
  lines.push(`- Confirmed: ${confirmed} | Corrections: ${corrections} | Additions: ${additions} | Removals: ${removals}`);
  lines.push("");

  // Full table — sorted: NO_INFO (dog or kid) first for manual review
  const sortedEntries = [...entries].sort((a, b) => {
    const aNoInfo = (a.flags.dogFriendly.confidence === "low" ? 1 : 0) + (a.flags.kidFriendly.confidence === "low" ? 1 : 0);
    const bNoInfo = (b.flags.dogFriendly.confidence === "low" ? 1 : 0) + (b.flags.kidFriendly.confidence === "low" ? 1 : 0);
    if (aNoInfo !== bNoInfo) return bNoInfo - aNoInfo; // more NO_INFO first
    return a.name.localeCompare(b.name);
  });

  const noInfoBoth = sortedEntries.filter(e => e.flags.dogFriendly.confidence === "low" && e.flags.kidFriendly.confidence === "low" && e.siteReachable);
  const noInfoOne = sortedEntries.filter(e => (e.flags.dogFriendly.confidence === "low" || e.flags.kidFriendly.confidence === "low") && !(e.flags.dogFriendly.confidence === "low" && e.flags.kidFriendly.confidence === "low") && e.siteReachable);

  lines.push("## Listings Needing Manual Review (NO_INFO on dog or kid)\n");
  lines.push(`**No info on BOTH dog + kid:** ${noInfoBoth.length} listings`);
  lines.push(`**No info on ONE of dog/kid:** ${noInfoOne.length} listings\n`);

  lines.push("## Full Audit Table\n");
  lines.push("| Name | Type | Flag | Result | Conf | DB | Change? | Overall | Quote | Source |");
  lines.push("|------|------|------|--------|------|----|---------|---------|-------|--------|");

  for (const e of sortedEntries) {
    for (const [flag, result] of Object.entries(e.flags) as [string, FlagResult][]) {
      const current = e.currentDb[flag as keyof typeof e.currentDb];
      const resultIcon = result.confidence === "low" ? "—" : result.value ? "✅" : "❌";
      const confIcon = result.confidence === "high" ? "H" : result.confidence === "medium" ? "M" : "L";
      const dbIcon = current ? "✅" : "❌";
      let changeIcon = "—";
      if (result.confidence !== "low" && result.value !== current) changeIcon = `${dbIcon}→${resultIcon}`;
      else if (result.confidence === "low" && current) changeIcon = "✅→—";

      if (result.quotes.length === 0) {
        const quote = result.confidence === "low" ? "No evidence found" : result.reasoning;
        lines.push(`| ${e.name} | ${e.type} | ${flag} | ${resultIcon} | ${confIcon} | ${dbIcon} | ${changeIcon} | ${result.overall} | ${quote.slice(0, 80)} | ${e.pagesChecked.length > 0 ? e.pagesChecked.length + " pages" : "unreachable"} |`);
      } else {
        for (let qi = 0; qi < result.quotes.length; qi++) {
          const q = result.quotes[qi];
          const nameCol = qi === 0 ? e.name : "";
          const typeCol = qi === 0 ? e.type : "";
          const flagCol = qi === 0 ? flag : "";
          const resultCol = qi === 0 ? resultIcon : "";
          const confCol = qi === 0 ? confIcon : "";
          const dbCol = qi === 0 ? dbIcon : "";
          const changeCol = qi === 0 ? changeIcon : "";
          const overallCol = qi === 0 ? result.overall : "";
          lines.push(`| ${nameCol} | ${typeCol} | ${flagCol} | ${resultCol} | ${confCol} | ${dbCol} | ${changeCol} | ${overallCol} | "${q.quote.slice(0, 80)}" | ${q.sourceUrl} |`);
        }
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

// --- Main ---
async function main() {
  if (dryRun) { console.log("=== DRY RUN ===\n"); }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const browserPage = await context.newPage();

  const entries: AuditEntry[] = [];

  try {
    // --- WINERIES ---
    if (!typeFilter || typeFilter === "wineries") {
      let allWineries = await db
        .select({
          id: wineries.id, slug: wineries.slug, name: wineries.name,
          websiteUrl: wineries.websiteUrl,
          dogFriendly: wineries.dogFriendly, kidFriendly: wineries.kidFriendly,
          picnicFriendly: wineries.picnicFriendly, sustainableFarming: wineries.sustainableFarming,
        })
        .from(wineries)
        .where(isNotNull(wineries.websiteUrl));

      if (slugFilter) allWineries = allWineries.filter((w) => slugFilter.includes(w.slug));

      console.log(`=== Wineries: ${allWineries.length} ===\n`);

      for (let i = 0; i < allWineries.length; i++) {
        const w = allWineries[i];
        process.stdout.write(`[${i + 1}/${allWineries.length}] ${w.name}...`);
        if (dryRun) { console.log(" (dry run)"); continue; }

        const currentDb = {
          dogFriendly: !!w.dogFriendly, kidFriendly: !!w.kidFriendly,
          picnicFriendly: !!w.picnicFriendly, sustainable: !!w.sustainableFarming,
        };

        const pageData = await discoverAndFetchPages(browserPage, w.websiteUrl!, "winery", w.slug, w.name);

        if (pageData.length === 0) {
          console.log(" UNREACHABLE");
          entries.push({
            type: "winery", id: w.id, slug: w.slug, name: w.name,
            websiteUrl: w.websiteUrl!, pagesChecked: [], siteReachable: false,
            flags: { dogFriendly: emptyResult(), kidFriendly: emptyResult(), picnicFriendly: emptyResult(), sustainable: emptyResult() },
            currentDb,
          });
          continue;
        }

        const allQuotes = mergeQuotes(pageData.map((p) => p.quotes));
        const pagesChecked = pageData.map((p) => p.url);
        const hasAnyQuotes = allQuotes.dogs.length + allQuotes.kids.length + allQuotes.picnic.length + allQuotes.sustainable.length > 0;

        let classification: ClassificationResult | null = null;
        if (hasAnyQuotes) {
          classification = await classifyAllQuotes(w.name, allQuotes);
        }

        // Map to results
        const dogMap = classification ? mapDog(classification.dogs.overall) : { value: false, confidence: "low" as Confidence };
        const kidMap = classification ? mapKid(classification.kids.overall) : { value: false, confidence: "low" as Confidence };
        const picnicMap = classification ? mapPicnic(classification.picnic.overall, allQuotes.picnic) : { value: false, confidence: "low" as Confidence };
        const sustainableMap = classification ? mapSustainable(classification.sustainable.overall) : { value: false, confidence: "low" as Confidence };

        // Treat DB as blank slate — if no evidence found, flag is false
        const dogResult = dogMap;
        const kidResult = kidMap;
        const picnicResult = picnicMap;
        const sustainableResult = sustainableMap;

        // Build quote arrays with source URLs
        const dogQuotesWithUrl = allQuotes.dogs.map((q) => ({ ...q, sourceUrl: pageData.find((p) => p.quotes.dogs.some((d) => d.quote === q.quote))?.url || "" }));
        const kidQuotesWithUrl = allQuotes.kids.map((q) => ({ ...q, sourceUrl: pageData.find((p) => p.quotes.kids.some((d) => d.quote === q.quote))?.url || "" }));
        const picnicQuotesWithUrl = allQuotes.picnic.map((q) => ({ ...q, sourceUrl: pageData.find((p) => p.quotes.picnic.some((d) => d.quote === q.quote))?.url || "" }));
        const sustainableQuotesWithUrl = allQuotes.sustainable.map((q) => ({ ...q, sourceUrl: pageData.find((p) => p.quotes.sustainable.some((d) => d.quote === q.quote))?.url || "" }));

        entries.push({
          type: "winery", id: w.id, slug: w.slug, name: w.name,
          websiteUrl: w.websiteUrl!, pagesChecked, siteReachable: true,
          flags: {
            dogFriendly: { ...dogResult, overall: classification?.dogs.overall || "NO_INFO", reasoning: classification?.dogs.reasoning || "", quotes: dogQuotesWithUrl },
            kidFriendly: { ...kidResult, overall: classification?.kids.overall || "NO_INFO", reasoning: classification?.kids.reasoning || "", quotes: kidQuotesWithUrl },
            picnicFriendly: { ...picnicResult, overall: classification?.picnic.overall || "NO_INFO", reasoning: classification?.picnic.reasoning || "", quotes: picnicQuotesWithUrl },
            sustainable: { ...sustainableResult, overall: classification?.sustainable.overall || "NO_INFO", reasoning: classification?.sustainable.reasoning || "", quotes: sustainableQuotesWithUrl },
          },
          currentDb,
        });

        const changes = Object.entries({ dogFriendly: dogResult, kidFriendly: kidResult, picnicFriendly: picnicResult, sustainable: sustainableResult })
          .filter(([flag, result]) => {
            const current = currentDb[flag as keyof typeof currentDb];
            return (result.confidence !== "low" && result.value !== current) || (result.confidence === "low" && current);
          });

        console.log(changes.length > 0 ? ` ${changes.length} change(s) (${pagesChecked.length} pages)` : ` OK (${pagesChecked.length} pages)`);
      }
    }

    // --- ACCOMMODATIONS ---
    if (!typeFilter || typeFilter === "accommodations") {
      let allAccomm = await db
        .select({
          id: accommodations.id, slug: accommodations.slug, name: accommodations.name,
          websiteUrl: accommodations.websiteUrl,
          dogFriendly: accommodations.dogFriendly, kidFriendly: accommodations.kidFriendly,
          adultsOnly: accommodations.adultsOnly,
        })
        .from(accommodations)
        .where(isNotNull(accommodations.websiteUrl));

      if (slugFilter) allAccomm = allAccomm.filter((a) => slugFilter.includes(a.slug));

      console.log(`\n=== Accommodations: ${allAccomm.length} ===\n`);

      for (let i = 0; i < allAccomm.length; i++) {
        const a = allAccomm[i];
        process.stdout.write(`[${i + 1}/${allAccomm.length}] ${a.name}...`);
        if (dryRun) { console.log(" (dry run)"); continue; }

        const currentDb = {
          dogFriendly: !!a.dogFriendly, kidFriendly: !!a.kidFriendly,
          adultsOnly: !!a.adultsOnly, picnicFriendly: false, sustainable: false,
        };

        const pageData = await discoverAndFetchPages(browserPage, a.websiteUrl!, "accommodation", a.slug, a.name);

        if (pageData.length === 0) {
          console.log(" UNREACHABLE");
          entries.push({
            type: "accommodation", id: a.id, slug: a.slug, name: a.name,
            websiteUrl: a.websiteUrl!, pagesChecked: [], siteReachable: false,
            flags: { dogFriendly: emptyResult(), kidFriendly: emptyResult(), picnicFriendly: emptyResult(), sustainable: emptyResult() },
            currentDb,
          });
          continue;
        }

        const allQuotes = mergeQuotes(pageData.map((p) => p.quotes));
        const pagesChecked = pageData.map((p) => p.url);
        const hasAnyQuotes = allQuotes.dogs.length + allQuotes.kids.length > 0;

        let classification: ClassificationResult | null = null;
        if (hasAnyQuotes) {
          classification = await classifyAllQuotes(a.name, allQuotes);
        }

        // Treat DB as blank slate
        const dogResult = classification ? mapDog(classification.dogs.overall) : { value: false, confidence: "low" as Confidence };
        const kidResult = classification ? mapKid(classification.kids.overall) : { value: false, confidence: "low" as Confidence };

        // For accommodations: BLANKET_BAN on kids = adults-only property
        // WELCOME on kids = not adults-only
        // We store this in the kidFriendly flag but also track adultsOnly
        // The kidFriendly result already handles this: BLANKET_BAN → false, WELCOME → true

        const dogQuotesWithUrl = allQuotes.dogs.map((q) => ({ ...q, sourceUrl: pageData.find((p) => p.quotes.dogs.some((d) => d.quote === q.quote))?.url || "" }));
        const kidQuotesWithUrl = allQuotes.kids.map((q) => ({ ...q, sourceUrl: pageData.find((p) => p.quotes.kids.some((d) => d.quote === q.quote))?.url || "" }));

        entries.push({
          type: "accommodation", id: a.id, slug: a.slug, name: a.name,
          websiteUrl: a.websiteUrl!, pagesChecked, siteReachable: true,
          flags: {
            dogFriendly: { ...dogResult, overall: classification?.dogs.overall || "NO_INFO", reasoning: classification?.dogs.reasoning || "", quotes: dogQuotesWithUrl },
            kidFriendly: { ...kidResult, overall: classification?.kids.overall || "NO_INFO", reasoning: classification?.kids.reasoning || "", quotes: kidQuotesWithUrl },
            picnicFriendly: emptyResult(),
            sustainable: emptyResult(),
          },
          currentDb,
        });

        const changes = [dogResult, kidResult].filter((r, idx) => {
          const current = idx === 0 ? currentDb.dogFriendly : currentDb.kidFriendly;
          return (r.confidence !== "low" && r.value !== current) || (r.confidence === "low" && current);
        });

        console.log(changes.length > 0 ? ` ${changes.length} change(s) (${pagesChecked.length} pages)` : ` OK (${pagesChecked.length} pages)`);
      }
    }
  } finally {
    await browser.close();
  }

  if (dryRun) { console.log("\nDry run complete."); return; }

  writeFileSync("amenity-audit-v3-report.json", JSON.stringify(entries, null, 2));
  writeFileSync("amenity-audit-v3-report.md", generateReport(entries));

  // Summary
  let corrections = 0, additions = 0, removals = 0;
  for (const e of entries) {
    for (const [flag, result] of Object.entries(e.flags)) {
      const current = e.currentDb[flag as keyof typeof e.currentDb];
      if (result.confidence === "low" && current) removals++;
      else if (result.confidence !== "low" && result.value !== current) {
        if (current) corrections++; else additions++;
      }
    }
  }

  console.log("\n========================================");
  console.log("      AMENITY AUDIT v3 COMPLETE");
  console.log("========================================");
  console.log(`Corrections: ${corrections} | Additions: ${additions} | Removals: ${removals}`);
  console.log(`Reports: amenity-audit-v3-report.json / .md`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
