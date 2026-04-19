/**
 * Audit each social caption against its Turso editorial source using gpt-4o-mini.
 *
 * Catches: caption claims that aren't supported by the source editorial
 *   (Claude embellishing beyond what the editorial actually says)
 *
 * Does NOT catch: source editorial itself being wrong about reality
 *   (e.g., editorial says "caves" when the entity has no caves — see Silver Oak)
 *
 * Usage:
 *   npx tsx scripts/audit-caption-factuality.ts             # audit all
 *   npx tsx scripts/audit-caption-factuality.ts --limit=20  # first 20
 *   npx tsx scripts/audit-caption-factuality.ts --slug=... # single
 *
 * Cost: gpt-4o-mini at $0.15/M input + $0.60/M output
 *   ~315 entities × ~900 tokens ≈ ~$0.07 total
 *
 * Output: writes flagged captions to /tmp/caption-audit.md for review
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, accommodations, socialPosts } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";

const limitArg = process.argv
  .find((a) => a.startsWith("--limit="))
  ?.split("=")[1];
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
const slugFilter = process.argv
  .filter((a) => a.startsWith("--slug="))
  .map((a) => a.split("=")[1])
  .filter(Boolean);

const dbUrl = process.env.DATABASE_URL;
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");

if (!dbUrl || !process.env.OPENAI_API_KEY) {
  console.error("Missing DATABASE_URL or OPENAI_API_KEY");
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DELAY_MS = 150;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Output schema ---

const AuditResult = z.object({
  flaggedClaims: z
    .array(
      z.object({
        claim: z
          .string()
          .describe("The specific phrase or sentence from the caption that may not be supported"),
        reason: z
          .string()
          .describe("Why this claim isn't supported by the source editorial"),
      })
    )
    .describe("Empty array if caption is fully supported"),
  verdict: z
    .enum(["clean", "minor", "major"])
    .describe(
      "clean = all claims supported; minor = slight paraphrase beyond source but close; major = invented facts not in source"
    ),
});

const SYSTEM_PROMPT = `You are fact-checking a social media caption against its source editorial description. Your job is to flag specific claims in the caption that aren't supported by the source.

Flag things like:
- Numbers, years, dates, acreage, quantities not in the source
- Named people (chefs, winemakers, owners, families) not in the source
- Certifications (LEED, Michelin, organic, biodynamic, regenerative) not in the source
- Historical claims ("founded in 1884", "first in Napa to...") not in the source
- Specific physical features (cave, barn, gazebo, pyramid, airstream, etc.) not in the source
- Superlatives ("oldest", "only", "first") not in the source

Do NOT flag:
- General atmosphere descriptions that reasonably paraphrase the source
- Minor word substitutions (e.g., "vines" for "vineyards", "building" for "estate")
- Hashtags or metadata at the end
- Location references (city, region, valley) that are obviously true
- Claims broadly supported by the source even if the wording is different

Be strict on specific facts. Be lenient on mood and tone.`;

interface AuditRow {
  slug: string;
  type: string;
  name: string;
  caption: string;
  flaggedClaims: { claim: string; reason: string }[];
  verdict: "clean" | "minor" | "major";
}

async function main() {
  // Fetch all social posts with their editorial source
  const posts = await db
    .select({
      slug: socialPosts.entitySlug,
      type: socialPosts.entityType,
      captionInstagram: socialPosts.captionInstagram,
      captionPinterest: socialPosts.captionPinterest,
    })
    .from(socialPosts);

  let toAudit = slugFilter.length > 0
    ? posts.filter((p) => slugFilter.includes(p.slug))
    : posts;
  toAudit = toAudit.slice(0, limit);

  console.log(`\n--- Factuality Audit (gpt-4o-mini) ---`);
  console.log(`Total posts: ${posts.length}`);
  console.log(`To audit: ${toAudit.length}`);
  console.log(`Estimated cost: ~$${((toAudit.length * 900) / 1_000_000 * 0.15 + (toAudit.length * 150) / 1_000_000 * 0.6).toFixed(3)}\n`);

  const results: AuditRow[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < toAudit.length; i++) {
    const post = toAudit[i];

    // Fetch editorial source from Turso — narrow select to avoid schema drift
    // (accommodations.sustainable is declared in Drizzle but missing in Turso)
    let editorial = "";
    let name = post.slug;
    if (post.type === "winery") {
      const [w] = await db
        .select({
          name: wineries.name,
          shortDescription: wineries.shortDescription,
          whyVisit: wineries.whyVisit,
          theSetting: wineries.theSetting,
          tastingRoomVibe: wineries.tastingRoomVibe,
          whyThisWinery: wineries.whyThisWinery,
        })
        .from(wineries)
        .where(eq(wineries.slug, post.slug))
        .limit(1);
      if (w) {
        name = w.name;
        editorial = [
          w.shortDescription && `Overview: ${w.shortDescription}`,
          w.whyVisit && `Why visit: ${w.whyVisit}`,
          w.theSetting && `Setting: ${w.theSetting}`,
          w.tastingRoomVibe && `Tasting room: ${w.tastingRoomVibe}`,
          w.whyThisWinery && `Why this winery: ${w.whyThisWinery}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
    } else {
      const [a] = await db
        .select({
          name: accommodations.name,
          shortDescription: accommodations.shortDescription,
          whyStayHere: accommodations.whyStayHere,
          theSetting: accommodations.theSetting,
          theExperience: accommodations.theExperience,
          whyThisHotel: accommodations.whyThisHotel,
        })
        .from(accommodations)
        .where(eq(accommodations.slug, post.slug))
        .limit(1);
      if (a) {
        name = a.name;
        editorial = [
          a.shortDescription && `Overview: ${a.shortDescription}`,
          a.whyStayHere && `Why stay: ${a.whyStayHere}`,
          a.theSetting && `Setting: ${a.theSetting}`,
          a.theExperience && `Experience: ${a.theExperience}`,
          a.whyThisHotel && `Why this hotel: ${a.whyThisHotel}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    if (!editorial) {
      console.log(`[${i + 1}/${toAudit.length}] ${name}: ⚠ no editorial — skipping`);
      continue;
    }

    // Strip hashtags from the caption before auditing (hashtags are always added post-hoc)
    const igCaption = (post.captionInstagram ?? "").split(/\n\n/)[0];

    const userPrompt = `Entity: ${name}

Caption to fact-check:
"${igCaption}"

Source editorial (our database):
${editorial}

Return a list of flagged claims. Empty list if everything is supported.`;

    try {
      const completion = await openai.chat.completions.parse({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: zodResponseFormat(AuditResult, "audit"),
      });

      if (completion.usage) {
        totalInputTokens += completion.usage.prompt_tokens;
        totalOutputTokens += completion.usage.completion_tokens;
      }

      const parsed = completion.choices[0]?.message?.parsed;
      if (!parsed) {
        console.log(`[${i + 1}/${toAudit.length}] ${name}: ⚠ no result`);
        continue;
      }

      const result: AuditRow = {
        slug: post.slug,
        type: post.type,
        name,
        caption: igCaption,
        flaggedClaims: parsed.flaggedClaims,
        verdict: parsed.verdict,
      };
      results.push(result);

      const marker =
        parsed.verdict === "clean"
          ? "✓"
          : parsed.verdict === "minor"
          ? "△"
          : "✗";
      const count = parsed.flaggedClaims.length;
      console.log(
        `[${i + 1}/${toAudit.length}] ${marker} ${name} — ${parsed.verdict}${count > 0 ? ` (${count} flag${count > 1 ? "s" : ""})` : ""}`
      );

      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`[${i + 1}/${toAudit.length}] ${name}: ERROR — ${err}`);
    }
  }

  // Write full report to markdown
  const clean = results.filter((r) => r.verdict === "clean");
  const minor = results.filter((r) => r.verdict === "minor");
  const major = results.filter((r) => r.verdict === "major");

  const lines: string[] = [
    `# Caption Factuality Audit`,
    ``,
    `- Total audited: ${results.length}`,
    `- Clean: ${clean.length}`,
    `- Minor issues: ${minor.length}`,
    `- **Major issues: ${major.length}**`,
    ``,
    `Cost: $${((totalInputTokens / 1_000_000) * 0.15 + (totalOutputTokens / 1_000_000) * 0.6).toFixed(3)}`,
    `Tokens: ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`,
    ``,
    `---`,
    ``,
    `## Major issues (${major.length})`,
    ``,
  ];
  for (const r of major) {
    lines.push(`### ${r.name} (${r.slug})`);
    lines.push(`**Caption:** ${r.caption}`);
    lines.push(``);
    lines.push(`**Flagged:**`);
    for (const f of r.flaggedClaims) {
      lines.push(`- "${f.claim}" — ${f.reason}`);
    }
    lines.push(``);
  }
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Minor issues (${minor.length})`);
  lines.push(``);
  for (const r of minor) {
    lines.push(`### ${r.name} (${r.slug})`);
    lines.push(`**Caption:** ${r.caption}`);
    lines.push(``);
    lines.push(`**Flagged:**`);
    for (const f of r.flaggedClaims) {
      lines.push(`- "${f.claim}" — ${f.reason}`);
    }
    lines.push(``);
  }

  const outPath = "/tmp/caption-audit.md";
  fs.writeFileSync(outPath, lines.join("\n"));

  console.log(`\n--- Done ---`);
  console.log(`Clean: ${clean.length}`);
  console.log(`Minor: ${minor.length}`);
  console.log(`Major: ${major.length}`);
  console.log(
    `Cost: $${((totalInputTokens / 1_000_000) * 0.15 + (totalOutputTokens / 1_000_000) * 0.6).toFixed(3)}`
  );
  console.log(`Report: ${outPath}`);
}

main().catch(console.error);
