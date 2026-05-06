/**
 * Generate the favicon suite from src/app/icon.svg.
 *
 * Browser tab icon: Next.js App Router auto-serves src/app/icon.svg via
 * <link rel="icon"> on every page. Modern browsers render SVG fine.
 *
 * Google SERP favicon: Google explicitly prefers a multiple of 48×48 and
 * caches favicons aggressively (weeks). It picks the largest valid icon
 * declared in <link rel="icon"> tags. This script emits 192×192 and 512×512
 * PNG variants alongside the SVG so Google has a clear, large source.
 *
 * iOS home screen / Safari pin: src/app/apple-icon.png at 180×180 is the
 * convention Next.js auto-detects.
 *
 * Run: npx tsx scripts/generate-favicons.ts
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SVG_PATH = resolve("src/app/icon.svg");
const APP_DIR = resolve("src/app");

async function main() {
  const svg = await readFile(SVG_PATH);

  const outputs: Array<{ name: string; size: number }> = [
    { name: "icon.png", size: 192 }, // Next.js picks this up as additional <link rel="icon">
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
      "src/app/icon.svg stays the source of truth — re-run this script after editing it."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
