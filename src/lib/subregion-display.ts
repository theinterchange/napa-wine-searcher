/**
 * Pure display helpers for subregion names.
 *
 * Lives in its own file (no DB imports) so client and server components can
 * both consume it without dragging the data layer into the client bundle.
 */

/**
 * Subregion names that are ambiguous because they share (or nearly share)
 * their parent valley/county name. The classic example is "Sonoma Valley",
 * which is an AVA inside Sonoma County and not the county itself — first-time
 * visitors routinely conflate the two. Add new entries here if more name
 * conflicts appear in the data.
 */
const AMBIGUOUS_SUBREGION_NAMES = new Set<string>([
  "Sonoma Valley",
]);

/**
 * Disambiguated display name for a subregion. For ambiguous names, appends
 * "AVA" so the appellation is visually distinct from its parent county
 * everywhere it renders. Unambiguous names pass through unchanged.
 */
export function displaySubRegionName(
  name: string | null | undefined
): string {
  if (!name) return "";
  if (AMBIGUOUS_SUBREGION_NAMES.has(name)) return `${name} AVA`;
  return name;
}
