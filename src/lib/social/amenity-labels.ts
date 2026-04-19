import type { SocialEntity } from "@/app/nalaadmin/social-test/actions";

// AMENITY_LABELS + buildAvailableAmenityTags live here so scripts
// (generate-slides-batch, etc.) and UI can share one source of truth.

export const AMENITY_LABELS = {
  dogFriendly: "Dog-friendly",
  kidFriendly: "Kid-friendly",
  sustainable: "Sustainable",
  picnicFriendly: "Picnic",
  adultsOnly: "Adults-only",
} as const;

export function buildAvailableAmenityTags(e: SocialEntity): string[] {
  const tags: string[] = [];
  if (e.attributes.dogFriendly) tags.push(AMENITY_LABELS.dogFriendly);
  if (e.attributes.kidFriendly) tags.push(AMENITY_LABELS.kidFriendly);
  if (e.attributes.sustainable) tags.push(AMENITY_LABELS.sustainable);
  if (e.attributes.picnicFriendly) tags.push(AMENITY_LABELS.picnicFriendly);
  if (e.attributes.adultsOnly) tags.push(AMENITY_LABELS.adultsOnly);
  return tags;
}
