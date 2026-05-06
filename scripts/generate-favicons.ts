/**
 * Generate the favicon suite from the source SVG.
 *
 * Source of truth: assets/icon-source.svg (lives outside src/app/ so Next.js
 * doesn't auto-scan it — see context below).
 *
 * Browser tab icon: src/app/icon.png (192×192). Next.js App Router auto-serves
 * it via <link rel="icon">. Browsers downscale to 16/32px for tab display.
 *
 * Google SERP favicon: same icon.png. Google explicitly prefers a multiple of
 * 48×48 and caches favicons aggressively (weeks). It picks the largest valid
 * icon declared in <link rel="icon"> tags.
 *
 * iOS home screen / Safari pin: src/app/apple-icon.png at 180×180 is the
 * convention Next.js auto-detects.
 *
 * Why the SVG lives in assets/ and not src/app/: Next.js 16.1.6 Turbopack
 * panics with "Dependency tracking is disabled" when both icon.svg and
 * icon.png coexist in src/app/. Keeping the SVG in assets/ as the design
 * source — never served — sidesteps the bug.
 *
 * Run: npx tsx scripts/generate-favicons.ts
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SVG_PATH = resolve("assets/icon-source.svg");
const APP_DIR = resolve("src/app");

async function main() {
  const svg = await readFile(SVG_PATH);

  const outputs: Array<{ name: string; size: number }> = [
    { name: "icon.png", size: 192 }, // Next.js picks this up as <link rel="icon">
    { name: "apple-icon.png", size: 180 }, // iOS home screen
  ];

  for (const { name, size } of outputs) {
    const out = resolve(APP_DIR, name);
    const buf = await sharp(svg)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await writeFile(out, buf);
    console.log(`  ✓ ${name} (${size}×${size})`);
  }

  console.log(
    "\nDone. Next.js auto-serves these via <link rel=\"icon\"> headers.\n" +
      "assets/icon-source.svg stays the source of truth — re-run this script after editing it."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
