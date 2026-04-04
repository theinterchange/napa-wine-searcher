import { db } from "@/db";
import {
  outboundClicks,
  emailSubscribers,
  pitchEmails,
  wineries,
  accommodations,
  subRegions,
  tastingExperiences,
  wineryPhotos,
} from "@/db/schema";
import { count, eq, gte, and, isNotNull, desc, sql, countDistinct } from "drizzle-orm";

type DateFilter = string | null;

function dateWhere(startDate: DateFilter) {
  return startDate ? gte(outboundClicks.createdAt, startDate) : undefined;
}

function subDateWhere(startDate: DateFilter) {
  return startDate ? gte(emailSubscribers.subscribedAt, startDate) : undefined;
}

export async function getTotalClicks(startDate: DateFilter) {
  const where = dateWhere(startDate);
  const [result] = await db
    .select({ total: count() })
    .from(outboundClicks)
    .where(where);
  return result.total;
}

export async function getUniqueWineriesClicked(startDate: DateFilter) {
  const conditions = [isNotNull(outboundClicks.wineryId)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  const [result] = await db
    .select({ total: countDistinct(outboundClicks.wineryId) })
    .from(outboundClicks)
    .where(and(...conditions));
  return result.total;
}

export async function getClicksByType(startDate: DateFilter) {
  const where = dateWhere(startDate);
  return db
    .select({
      clickType: outboundClicks.clickType,
      total: count(),
    })
    .from(outboundClicks)
    .where(where)
    .groupBy(outboundClicks.clickType)
    .orderBy(desc(count()));
}

export async function getClickTrend(startDate: DateFilter) {
  const where = dateWhere(startDate);
  return db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${outboundClicks.createdAt})`.as(
        "date"
      ),
      total: count(),
    })
    .from(outboundClicks)
    .where(where)
    .groupBy(sql`strftime('%Y-%m-%d', ${outboundClicks.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${outboundClicks.createdAt})`);
}

export async function getTopWineries(startDate: DateFilter, limit = 10) {
  const conditions = [isNotNull(outboundClicks.wineryId)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  return db
    .select({
      wineryId: outboundClicks.wineryId,
      name: wineries.name,
      slug: wineries.slug,
      total: count(),
    })
    .from(outboundClicks)
    .innerJoin(wineries, eq(outboundClicks.wineryId, wineries.id))
    .where(and(...conditions))
    .groupBy(outboundClicks.wineryId, wineries.name, wineries.slug)
    .orderBy(desc(count()))
    .limit(limit);
}

export async function getTopAccommodations(startDate: DateFilter, limit = 5) {
  const conditions = [
    isNotNull(outboundClicks.accommodationId),
    eq(outboundClicks.clickType, "book_hotel"),
  ];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  return db
    .select({
      accommodationId: outboundClicks.accommodationId,
      name: accommodations.name,
      slug: accommodations.slug,
      total: count(),
    })
    .from(outboundClicks)
    .innerJoin(
      accommodations,
      eq(outboundClicks.accommodationId, accommodations.id)
    )
    .where(and(...conditions))
    .groupBy(
      outboundClicks.accommodationId,
      accommodations.name,
      accommodations.slug
    )
    .orderBy(desc(count()))
    .limit(limit);
}

export async function getSubscriberStats(startDate: DateFilter) {
  const [[totalResult], [newResult], bySource] = await Promise.all([
    db.select({ total: count() }).from(emailSubscribers),
    startDate
      ? db
          .select({ total: count() })
          .from(emailSubscribers)
          .where(subDateWhere(startDate))
      : Promise.resolve([{ total: 0 }]),
    db
      .select({
        source: emailSubscribers.source,
        total: count(),
      })
      .from(emailSubscribers)
      .groupBy(emailSubscribers.source)
      .orderBy(desc(count())),
  ]);
  return {
    total: totalResult.total,
    newInPeriod: newResult.total,
    bySource,
  };
}

// Per-winery queries for the pitch page

export async function getWineryInfo(wineryId: number) {
  const [winery] = await db
    .select({
      id: wineries.id,
      name: wineries.name,
      slug: wineries.slug,
      valley: subRegions.valley,
      googleRating: wineries.googleRating,
      googleReviewCount: wineries.googleReviewCount,
      city: wineries.city,
      email: wineries.email,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(wineries.id, wineryId));
  return winery;
}

export async function getWineryClickTotal(
  wineryId: number,
  startDate: DateFilter
) {
  const conditions = [eq(outboundClicks.wineryId, wineryId)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  const [result] = await db
    .select({ total: count() })
    .from(outboundClicks)
    .where(and(...conditions));
  return result.total;
}

export async function getWineryClicksByType(
  wineryId: number,
  startDate: DateFilter
) {
  const conditions = [eq(outboundClicks.wineryId, wineryId)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  return db
    .select({
      clickType: outboundClicks.clickType,
      total: count(),
    })
    .from(outboundClicks)
    .where(and(...conditions))
    .groupBy(outboundClicks.clickType)
    .orderBy(desc(count()));
}

export async function getWineryClickTrend(
  wineryId: number,
  startDate: DateFilter
) {
  const conditions = [eq(outboundClicks.wineryId, wineryId)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  return db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${outboundClicks.createdAt})`.as(
        "date"
      ),
      total: count(),
    })
    .from(outboundClicks)
    .where(and(...conditions))
    .groupBy(sql`strftime('%Y-%m-%d', ${outboundClicks.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${outboundClicks.createdAt})`);
}

export async function getWinerySourcePages(
  wineryId: number,
  startDate: DateFilter
) {
  const conditions = [
    eq(outboundClicks.wineryId, wineryId),
    isNotNull(outboundClicks.sourcePage),
  ];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  return db
    .select({
      sourcePage: outboundClicks.sourcePage,
      total: count(),
    })
    .from(outboundClicks)
    .where(and(...conditions))
    .groupBy(outboundClicks.sourcePage)
    .orderBy(desc(count()))
    .limit(10);
}

export async function getWineryPeriodComparison(
  wineryId: number,
  currentStart: string,
  previousStart: string,
  currentEnd: string
) {
  const [current, previous] = await Promise.all([
    db
      .select({ total: count() })
      .from(outboundClicks)
      .where(
        and(
          eq(outboundClicks.wineryId, wineryId),
          gte(outboundClicks.createdAt, currentStart)
        )
      ),
    db
      .select({ total: count() })
      .from(outboundClicks)
      .where(
        and(
          eq(outboundClicks.wineryId, wineryId),
          gte(outboundClicks.createdAt, previousStart),
          sql`${outboundClicks.createdAt} < ${currentEnd}`
        )
      ),
  ]);
  const curr = current[0].total;
  const prev = previous[0].total;
  const change =
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
  return { current: curr, previous: prev, changePercent: change };
}

// Leaderboard: all wineries with stats for listing score + engagement

export async function getAllWineriesWithStats(startDate: DateFilter) {
  // Get all wineries with subregion info
  const allWineries = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      valley: subRegions.valley,
      city: wineries.city,
      address: wineries.address,
      phone: wineries.phone,
      email: wineries.email,
      websiteUrl: wineries.websiteUrl,
      heroImageUrl: wineries.heroImageUrl,
      whyVisit: wineries.whyVisit,
      description: wineries.description,
      priceLevel: wineries.priceLevel,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      hoursJson: wineries.hoursJson,
      knownFor: wineries.knownFor,
      theSetting: wineries.theSetting,
      tastingRoomVibe: wineries.tastingRoomVibe,
      visitorTips: wineries.visitorTips,
      googleRating: wineries.googleRating,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id));

  // Get click counts per winery (current period)
  const clickConditions = [isNotNull(outboundClicks.wineryId)];
  if (startDate) clickConditions.push(gte(outboundClicks.createdAt, startDate));
  const clickCounts = await db
    .select({
      wineryId: outboundClicks.wineryId,
      total: count(),
    })
    .from(outboundClicks)
    .where(and(...clickConditions))
    .groupBy(outboundClicks.wineryId);

  // Get tasting counts per winery
  const tastingCounts = await db
    .select({
      wineryId: tastingExperiences.wineryId,
      total: count(),
    })
    .from(tastingExperiences)
    .groupBy(tastingExperiences.wineryId);

  // Get photo counts per winery
  const photoCounts = await db
    .select({
      wineryId: wineryPhotos.wineryId,
      total: count(),
    })
    .from(wineryPhotos)
    .groupBy(wineryPhotos.wineryId);

  // Get latest pitch email per winery
  const latestPitches = await db
    .select({
      wineryId: pitchEmails.wineryId,
      sentAt: sql<string>`MAX(${pitchEmails.sentAt})`.as("sent_at"),
    })
    .from(pitchEmails)
    .groupBy(pitchEmails.wineryId);

  const clickMap = new Map(clickCounts.map((c) => [c.wineryId, c.total]));
  const tastingMap = new Map(tastingCounts.map((t) => [t.wineryId, t.total]));
  const photoMap = new Map(photoCounts.map((p) => [p.wineryId, p.total]));
  const pitchMap = new Map(latestPitches.map((p) => [p.wineryId, p.sentAt]));

  return allWineries.map((w) => ({
    ...w,
    clicks: clickMap.get(w.id) ?? 0,
    tastingCount: tastingMap.get(w.id) ?? 0,
    photoCount: photoMap.get(w.id) ?? 0,
    lastPitchedAt: pitchMap.get(w.id) ?? null,
  }));
}

// Pitch email history for a specific winery

export async function getWineryPitchHistory(wineryId: number) {
  return db
    .select({
      id: pitchEmails.id,
      subject: pitchEmails.subject,
      recipientEmail: pitchEmails.recipientEmail,
      sentAt: pitchEmails.sentAt,
    })
    .from(pitchEmails)
    .where(eq(pitchEmails.wineryId, wineryId))
    .orderBy(desc(pitchEmails.sentAt));
}
