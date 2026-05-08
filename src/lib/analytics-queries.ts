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
  pageImpressions,
  gscDailyQueries,
  users,
  accounts,
  favorites,
  wineJournalEntries,
  savedTrips,
  anonymousTrips,
  anonymousTripStops,
} from "@/db/schema";
import { count, eq, gte, lte, and, isNotNull, desc, sql, countDistinct, sum, inArray } from "drizzle-orm";

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

// ===== Subscribers list =====

export async function getAllSubscribers() {
  return db
    .select({
      id: emailSubscribers.id,
      email: emailSubscribers.email,
      source: emailSubscribers.source,
      subscribedAt: emailSubscribers.subscribedAt,
    })
    .from(emailSubscribers)
    .orderBy(desc(emailSubscribers.subscribedAt));
}

export async function getSubscriberTrend(startDate: DateFilter) {
  const where = subDateWhere(startDate);
  return db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${emailSubscribers.subscribedAt})`.as(
        "date"
      ),
      total: count(),
    })
    .from(emailSubscribers)
    .where(where)
    .groupBy(sql`strftime('%Y-%m-%d', ${emailSubscribers.subscribedAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${emailSubscribers.subscribedAt})`);
}

// ===== Click destinations =====

export async function getClicksByDestination(
  startDate: DateFilter,
  limit = 100
) {
  const where = dateWhere(startDate);
  return db
    .select({
      destinationUrl: outboundClicks.destinationUrl,
      clickType: outboundClicks.clickType,
      total: count(),
      lastClicked: sql<string>`MAX(${outboundClicks.createdAt})`.as(
        "last_clicked"
      ),
    })
    .from(outboundClicks)
    .where(where)
    .groupBy(outboundClicks.destinationUrl, outboundClicks.clickType)
    .orderBy(desc(count()))
    .limit(limit);
}

export async function getRecentClicks(limit = 200) {
  return db
    .select({
      id: outboundClicks.id,
      createdAt: outboundClicks.createdAt,
      clickType: outboundClicks.clickType,
      destinationUrl: outboundClicks.destinationUrl,
      sourcePage: outboundClicks.sourcePage,
      sourceComponent: outboundClicks.sourceComponent,
      wineryId: outboundClicks.wineryId,
      wineryName: wineries.name,
      winerySlug: wineries.slug,
      accommodationId: outboundClicks.accommodationId,
      accommodationName: accommodations.name,
      accommodationSlug: accommodations.slug,
    })
    .from(outboundClicks)
    .leftJoin(wineries, eq(outboundClicks.wineryId, wineries.id))
    .leftJoin(
      accommodations,
      eq(outboundClicks.accommodationId, accommodations.id)
    )
    .orderBy(desc(outboundClicks.createdAt))
    .limit(limit);
}

// ===== Traffic sources =====

export async function getTopSourcePages(startDate: DateFilter, limit = 20) {
  const conditions = [isNotNull(outboundClicks.sourcePage)];
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
    .limit(limit);
}

export async function getTopSourceComponents(
  startDate: DateFilter,
  limit = 20
) {
  const conditions = [isNotNull(outboundClicks.sourceComponent)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));
  return db
    .select({
      sourceComponent: outboundClicks.sourceComponent,
      total: count(),
    })
    .from(outboundClicks)
    .where(and(...conditions))
    .groupBy(outboundClicks.sourceComponent)
    .orderBy(desc(count()))
    .limit(limit);
}

// ===== Hour × day-of-week heatmap =====
// SQLite strftime: %w = day of week (0=Sunday), %H = hour (00-23)

export async function getClicksByHourOfWeek(startDate: DateFilter) {
  const where = dateWhere(startDate);
  return db
    .select({
      dow: sql<string>`strftime('%w', ${outboundClicks.createdAt})`.as("dow"),
      hour: sql<string>`strftime('%H', ${outboundClicks.createdAt})`.as("hour"),
      total: count(),
    })
    .from(outboundClicks)
    .where(where)
    .groupBy(
      sql`strftime('%w', ${outboundClicks.createdAt})`,
      sql`strftime('%H', ${outboundClicks.createdAt})`
    );
}

// ===== Click type × source page breakdown =====

export async function getClickTypeBySourcePage(
  startDate: DateFilter,
  limit = 8
) {
  const conditions = [isNotNull(outboundClicks.sourcePage)];
  if (startDate) conditions.push(gte(outboundClicks.createdAt, startDate));

  // Get top N source pages, then per-type counts for those pages
  const topPages = await db
    .select({
      sourcePage: outboundClicks.sourcePage,
      total: count(),
    })
    .from(outboundClicks)
    .where(and(...conditions))
    .groupBy(outboundClicks.sourcePage)
    .orderBy(desc(count()))
    .limit(limit);

  const pageNames = topPages
    .map((p) => p.sourcePage)
    .filter((p): p is string => p !== null);
  if (pageNames.length === 0) return [];

  const breakdown = await db
    .select({
      sourcePage: outboundClicks.sourcePage,
      clickType: outboundClicks.clickType,
      total: count(),
    })
    .from(outboundClicks)
    .where(
      and(
        ...conditions,
        sql`${outboundClicks.sourcePage} IN (${sql.join(
          pageNames.map((p) => sql`${p}`),
          sql`, `
        )})`
      )
    )
    .groupBy(outboundClicks.sourcePage, outboundClicks.clickType);

  return { topPages, breakdown };
}

// ===== Week-over-week comparison =====

export async function getWeekOverWeekStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const [thisWeekClicks, lastWeekClicks, thisWeekSubs, lastWeekSubs] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(outboundClicks)
        .where(gte(outboundClicks.createdAt, weekAgo)),
      db
        .select({ total: count() })
        .from(outboundClicks)
        .where(
          and(
            gte(outboundClicks.createdAt, twoWeeksAgo),
            sql`${outboundClicks.createdAt} < ${weekAgo}`
          )
        ),
      db
        .select({ total: count() })
        .from(emailSubscribers)
        .where(gte(emailSubscribers.subscribedAt, weekAgo)),
      db
        .select({ total: count() })
        .from(emailSubscribers)
        .where(
          and(
            gte(emailSubscribers.subscribedAt, twoWeeksAgo),
            sql`${emailSubscribers.subscribedAt} < ${weekAgo}`
          )
        ),
    ]);

  function pct(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  return {
    clicks: {
      current: thisWeekClicks[0].total,
      previous: lastWeekClicks[0].total,
      changePercent: pct(thisWeekClicks[0].total, lastWeekClicks[0].total),
    },
    subscribers: {
      current: thisWeekSubs[0].total,
      previous: lastWeekSubs[0].total,
      changePercent: pct(thisWeekSubs[0].total, lastWeekSubs[0].total),
    },
  };
}

// ===== Zero-click wineries count =====

export async function getZeroClickWineryCount() {
  const [totalResult] = await db
    .select({ total: count() })
    .from(wineries);
  const clicked = await db
    .select({ wineryId: outboundClicks.wineryId })
    .from(outboundClicks)
    .where(isNotNull(outboundClicks.wineryId))
    .groupBy(outboundClicks.wineryId);
  return totalResult.total - clicked.length;
}

// ===== On-site impressions (client-side beacon) =====

export async function getWineryImpressionStats(
  wineryId: number,
  startDate: DateFilter
) {
  const conditions = [eq(pageImpressions.wineryId, wineryId)];
  if (startDate) conditions.push(gte(pageImpressions.viewedAt, startDate));

  const [totals] = await db
    .select({
      total: count(),
      uniqueSessions: countDistinct(pageImpressions.sessionId),
    })
    .from(pageImpressions)
    .where(and(...conditions));

  return {
    totalViews: totals.total,
    uniqueSessions: totals.uniqueSessions,
  };
}

export async function getWineryImpressionTrend(
  wineryId: number,
  startDate: DateFilter
) {
  const conditions = [eq(pageImpressions.wineryId, wineryId)];
  if (startDate) conditions.push(gte(pageImpressions.viewedAt, startDate));

  return db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${pageImpressions.viewedAt})`.as(
        "date"
      ),
      total: count(),
    })
    .from(pageImpressions)
    .where(and(...conditions))
    .groupBy(sql`strftime('%Y-%m-%d', ${pageImpressions.viewedAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${pageImpressions.viewedAt})`);
}

// ===== GSC data (imported daily) =====

function buildGscPagePatterns(slug: string): string[] {
  // GSC reports page as full URL. Cover the redirected canonical www host.
  return [
    `https://www.napasonomaguide.com/wineries/${slug}`,
    `https://www.napasonomaguide.com/wineries/${slug}/`,
    `https://napasonomaguide.com/wineries/${slug}`,
    `https://napasonomaguide.com/wineries/${slug}/`,
  ];
}

export async function getWineryGscStats(
  slug: string,
  startDate: DateFilter,
  endDate?: string
) {
  const patterns = buildGscPagePatterns(slug);
  const conditions = [inArray(gscDailyQueries.page, patterns)];
  if (startDate) {
    conditions.push(gte(gscDailyQueries.date, startDate.slice(0, 10)));
  }
  if (endDate) {
    conditions.push(lte(gscDailyQueries.date, endDate.slice(0, 10)));
  }

  const [row] = await db
    .select({
      impressions: sum(gscDailyQueries.impressions),
      clicks: sum(gscDailyQueries.clicks),
      avgPosition: sql<number>`AVG(${gscDailyQueries.position})`,
    })
    .from(gscDailyQueries)
    .where(and(...conditions));

  const impressions = Number(row?.impressions ?? 0);
  const clicks = Number(row?.clicks ?? 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;

  return {
    impressions,
    clicks,
    ctr,
    avgPosition: Number(row?.avgPosition ?? 0),
  };
}

export async function getWineryTopQueries(
  slug: string,
  startDate: DateFilter,
  limit = 10
) {
  const patterns = buildGscPagePatterns(slug);
  const conditions = [inArray(gscDailyQueries.page, patterns)];
  if (startDate) {
    conditions.push(gte(gscDailyQueries.date, startDate.slice(0, 10)));
  }

  return db
    .select({
      query: gscDailyQueries.query,
      impressions: sum(gscDailyQueries.impressions),
      clicks: sum(gscDailyQueries.clicks),
      avgPosition: sql<number>`AVG(${gscDailyQueries.position})`,
    })
    .from(gscDailyQueries)
    .where(and(...conditions))
    .groupBy(gscDailyQueries.query)
    .orderBy(desc(sum(gscDailyQueries.impressions)))
    .limit(limit);
}

// ===== Account / user-creation analytics =====

export async function getAccountStats(startDate: DateFilter) {
  const [
    [totalRow],
    [withPasswordRow],
    [withUsernameRow],
    [publicProfileRow],
    [oauthRow],
    [newRow],
    [withFavoritesRow],
    [withJournalRow],
    [withSavedTripsRow],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db
      .select({ total: count() })
      .from(users)
      .where(isNotNull(users.passwordHash)),
    db
      .select({ total: count() })
      .from(users)
      .where(isNotNull(users.username)),
    db.select({ total: count() }).from(users).where(eq(users.isPublic, true)),
    db
      .select({ total: countDistinct(accounts.userId) })
      .from(accounts),
    startDate
      ? db
          .select({ total: count() })
          .from(users)
          .where(gte(users.createdAt, startDate))
      : Promise.resolve([{ total: 0 }]),
    db
      .select({ total: countDistinct(favorites.userId) })
      .from(favorites),
    db
      .select({ total: countDistinct(wineJournalEntries.userId) })
      .from(wineJournalEntries),
    db
      .select({ total: countDistinct(savedTrips.userId) })
      .from(savedTrips),
  ]);

  return {
    total: totalRow.total,
    newInPeriod: newRow.total,
    withPassword: withPasswordRow.total,
    withOAuth: oauthRow.total,
    withUsername: withUsernameRow.total,
    publicProfiles: publicProfileRow.total,
    withFavorites: withFavoritesRow.total,
    withJournal: withJournalRow.total,
    withSavedTrips: withSavedTripsRow.total,
  };
}

export async function getAccountTrend(startDate: DateFilter) {
  const conditions = [isNotNull(users.createdAt)];
  if (startDate) conditions.push(gte(users.createdAt, startDate));
  return db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${users.createdAt})`.as("date"),
      total: count(),
    })
    .from(users)
    .where(and(...conditions))
    .groupBy(sql`strftime('%Y-%m-%d', ${users.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${users.createdAt})`);
}

// ===== GSC site-wide analytics =====

export async function getGscSiteStats(startDate: DateFilter) {
  const conditions = [];
  if (startDate) conditions.push(gte(gscDailyQueries.date, startDate.slice(0, 10)));

  const [row] = await db
    .select({
      impressions: sum(gscDailyQueries.impressions),
      clicks: sum(gscDailyQueries.clicks),
      avgPosition: sql<number>`AVG(${gscDailyQueries.position})`,
      uniquePages: countDistinct(gscDailyQueries.page),
      uniqueQueries: countDistinct(gscDailyQueries.query),
    })
    .from(gscDailyQueries)
    .where(conditions.length ? and(...conditions) : undefined);

  const impressions = Number(row?.impressions ?? 0);
  const clicks = Number(row?.clicks ?? 0);
  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    avgPosition: Number(row?.avgPosition ?? 0),
    uniquePages: Number(row?.uniquePages ?? 0),
    uniqueQueries: Number(row?.uniqueQueries ?? 0),
  };
}

export async function getGscSiteTrend(startDate: DateFilter) {
  const conditions = [];
  if (startDate) conditions.push(gte(gscDailyQueries.date, startDate.slice(0, 10)));

  const rows = await db
    .select({
      date: gscDailyQueries.date,
      impressions: sum(gscDailyQueries.impressions),
      clicks: sum(gscDailyQueries.clicks),
    })
    .from(gscDailyQueries)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(gscDailyQueries.date)
    .orderBy(gscDailyQueries.date);

  return rows.map((r) => ({
    date: r.date,
    total: Number(r.clicks ?? 0),
    impressions: Number(r.impressions ?? 0),
  }));
}

export async function getGscTopQueriesSiteWide(startDate: DateFilter, limit = 10) {
  const conditions = [];
  if (startDate) conditions.push(gte(gscDailyQueries.date, startDate.slice(0, 10)));

  return db
    .select({
      query: gscDailyQueries.query,
      impressions: sum(gscDailyQueries.impressions),
      clicks: sum(gscDailyQueries.clicks),
      avgPosition: sql<number>`AVG(${gscDailyQueries.position})`,
    })
    .from(gscDailyQueries)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(gscDailyQueries.query)
    .orderBy(desc(sum(gscDailyQueries.impressions)))
    .limit(limit);
}

export async function getGscTopPagesSiteWide(startDate: DateFilter, limit = 10) {
  const conditions = [];
  if (startDate) conditions.push(gte(gscDailyQueries.date, startDate.slice(0, 10)));

  return db
    .select({
      page: gscDailyQueries.page,
      impressions: sum(gscDailyQueries.impressions),
      clicks: sum(gscDailyQueries.clicks),
      avgPosition: sql<number>`AVG(${gscDailyQueries.position})`,
    })
    .from(gscDailyQueries)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(gscDailyQueries.page)
    .orderBy(desc(sum(gscDailyQueries.impressions)))
    .limit(limit);
}

// ===== Trip planner usage =====

export async function getTripPlannerStats(startDate: DateFilter) {
  const dateCond = startDate ? [gte(anonymousTrips.createdAt, startDate)] : [];

  const [
    [totalRow],
    [withOriginRow],
    [withHomeBaseRow],
    [withNightsRow],
    [stopsRow],
  ] = await Promise.all([
    db.select({ total: count() }).from(anonymousTrips).where(dateCond.length ? and(...dateCond) : undefined),
    db
      .select({ total: count() })
      .from(anonymousTrips)
      .where(
        and(isNotNull(anonymousTrips.originLat), ...(dateCond.length ? dateCond : []))
      ),
    db
      .select({ total: count() })
      .from(anonymousTrips)
      .where(
        and(
          isNotNull(anonymousTrips.homeBaseAccommodationId),
          ...(dateCond.length ? dateCond : [])
        )
      ),
    db
      .select({ total: count() })
      .from(anonymousTrips)
      .where(
        and(isNotNull(anonymousTrips.nights), ...(dateCond.length ? dateCond : []))
      ),
    db
      .select({ total: count() })
      .from(anonymousTripStops)
      .innerJoin(anonymousTrips, eq(anonymousTripStops.tripId, anonymousTrips.id))
      .where(dateCond.length ? and(...dateCond) : undefined),
  ]);

  const totalTrips = totalRow.total;
  const totalStops = stopsRow.total;

  return {
    totalTrips,
    totalStops,
    avgStopsPerTrip: totalTrips > 0 ? +(totalStops / totalTrips).toFixed(1) : 0,
    withOrigin: withOriginRow.total,
    withHomeBase: withHomeBaseRow.total,
    withNights: withNightsRow.total,
  };
}

export async function getTripPlannerByTheme(startDate: DateFilter) {
  const conditions = [isNotNull(anonymousTrips.theme)];
  if (startDate) conditions.push(gte(anonymousTrips.createdAt, startDate));

  return db
    .select({
      theme: anonymousTrips.theme,
      total: count(),
    })
    .from(anonymousTrips)
    .where(and(...conditions))
    .groupBy(anonymousTrips.theme)
    .orderBy(desc(count()));
}

export async function getTripPlannerByValley(startDate: DateFilter) {
  const conditions = [isNotNull(anonymousTrips.valley)];
  if (startDate) conditions.push(gte(anonymousTrips.createdAt, startDate));

  return db
    .select({
      valley: anonymousTrips.valley,
      total: count(),
    })
    .from(anonymousTrips)
    .where(and(...conditions))
    .groupBy(anonymousTrips.valley)
    .orderBy(desc(count()));
}

export async function getTripPlannerTrend(startDate: DateFilter) {
  const conditions = [];
  if (startDate) conditions.push(gte(anonymousTrips.createdAt, startDate));

  return db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', ${anonymousTrips.createdAt})`.as("date"),
      total: count(),
    })
    .from(anonymousTrips)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(sql`strftime('%Y-%m-%d', ${anonymousTrips.createdAt})`)
    .orderBy(sql`strftime('%Y-%m-%d', ${anonymousTrips.createdAt})`);
}

// ===== Page impression analytics (site-wide) =====

export async function getPageImpressionStats(startDate: DateFilter) {
  const conditions = [];
  if (startDate) conditions.push(gte(pageImpressions.viewedAt, startDate));

  const [row] = await db
    .select({
      total: count(),
      sessions: countDistinct(pageImpressions.sessionId),
    })
    .from(pageImpressions)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    total: row.total,
    uniqueSessions: row.sessions,
    pagesPerSession: row.sessions > 0 ? +(row.total / row.sessions).toFixed(1) : 0,
  };
}

export async function getPageImpressionsByType(startDate: DateFilter) {
  const conditions = [isNotNull(pageImpressions.pageType)];
  if (startDate) conditions.push(gte(pageImpressions.viewedAt, startDate));

  return db
    .select({
      pageType: pageImpressions.pageType,
      total: count(),
    })
    .from(pageImpressions)
    .where(and(...conditions))
    .groupBy(pageImpressions.pageType)
    .orderBy(desc(count()));
}

export async function getTopReferrers(startDate: DateFilter, limit = 10) {
  const conditions = [
    isNotNull(pageImpressions.referrer),
    sql`${pageImpressions.referrer} <> ''`,
  ];
  if (startDate) conditions.push(gte(pageImpressions.viewedAt, startDate));

  return db
    .select({
      referrer: pageImpressions.referrer,
      total: count(),
    })
    .from(pageImpressions)
    .where(and(...conditions))
    .groupBy(pageImpressions.referrer)
    .orderBy(desc(count()))
    .limit(limit);
}

export async function getTopImpressionPages(startDate: DateFilter, limit = 10) {
  const conditions = [];
  if (startDate) conditions.push(gte(pageImpressions.viewedAt, startDate));

  return db
    .select({
      path: pageImpressions.path,
      total: count(),
    })
    .from(pageImpressions)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(pageImpressions.path)
    .orderBy(desc(count()))
    .limit(limit);
}

// ===== Spotlight performance =====
//
// For each entity that's been spotlighted (winery or accommodation), count the
// outbound clicks attributed to that entity during its assigned month. Returns
// the most recent N spotlights with their performance.

export async function getSpotlightPerformance(limit = 24) {
  const wineryRows = await db
    .select({
      kind: sql<string>`'winery'`.as("kind"),
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      yearMonth: wineries.spotlightYearMonth,
    })
    .from(wineries)
    .where(isNotNull(wineries.spotlightYearMonth))
    .orderBy(desc(wineries.spotlightYearMonth));

  const accommodationRows = await db
    .select({
      kind: sql<string>`'accommodation'`.as("kind"),
      id: accommodations.id,
      slug: accommodations.slug,
      name: accommodations.name,
      yearMonth: accommodations.spotlightYearMonth,
    })
    .from(accommodations)
    .where(isNotNull(accommodations.spotlightYearMonth))
    .orderBy(desc(accommodations.spotlightYearMonth));

  const all = [...wineryRows, ...accommodationRows]
    .filter((r) => r.yearMonth != null)
    .sort((a, b) => (b.yearMonth! > a.yearMonth! ? 1 : b.yearMonth! < a.yearMonth! ? -1 : 0))
    .slice(0, limit);

  // For each spotlight, count clicks during its assigned month.
  const enriched = await Promise.all(
    all.map(async (s) => {
      const ym = s.yearMonth!;
      const monthStart = `${ym}-01T00:00:00.000Z`;
      // First day of the next month.
      const [yStr, mStr] = ym.split("-");
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const nextY = m === 12 ? y + 1 : y;
      const nextM = m === 12 ? 1 : m + 1;
      const monthEnd = `${nextY}-${String(nextM).padStart(2, "0")}-01T00:00:00.000Z`;

      const conditions =
        s.kind === "winery"
          ? [eq(outboundClicks.wineryId, s.id)]
          : [eq(outboundClicks.accommodationId, s.id)];
      conditions.push(gte(outboundClicks.createdAt, monthStart));
      conditions.push(sql`${outboundClicks.createdAt} < ${monthEnd}`);

      const [row] = await db
        .select({ total: count() })
        .from(outboundClicks)
        .where(and(...conditions));

      return { ...s, clicks: row.total };
    })
  );

  return enriched;
}

