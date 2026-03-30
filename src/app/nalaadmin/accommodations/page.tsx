import { db } from "@/db";
import { accommodations, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AccommodationTable } from "./AccommodationTable";

export default async function AdminAccommodationsPage() {
  const allAccommodations = await db
    .select({
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      city: accommodations.city,
      type: accommodations.type,
      valley: accommodations.valley,
      subRegion: subRegions.name,
      googleRating: accommodations.googleRating,
      googleReviewCount: accommodations.googleReviewCount,
      priceTier: accommodations.priceTier,
      dogFriendly: accommodations.dogFriendly,
      kidFriendly: accommodations.kidFriendly,
      adultsOnly: accommodations.adultsOnly,
      roomsJson: accommodations.roomsJson,
      diningJson: accommodations.diningJson,
      spaJson: accommodations.spaJson,
      activitiesJson: accommodations.activitiesJson,
    })
    .from(accommodations)
    .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
    .orderBy(accommodations.name);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-6">Accommodations</h1>
      <AccommodationTable accommodations={allAccommodations} />
    </div>
  );
}
