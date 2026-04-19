/**
 * Researched hashtag library for Instagram and Pinterest keyword phrases.
 *
 * Strategy: 5 hashtags per IG post (Instagram's 2025 limit). Mix of:
 *   - 1 evergreen (broad reach)
 *   - 1 regional (geo-targeted discovery)
 *   - 1-2 thematic (attribute-based, niche engagement)
 *   - 1 branded (#NapaSonomaGuide)
 *
 * Avoids oversaturated tags (#wine = 80M+, buried in seconds)
 * and dead tags (#napasonomaguide = 0 posts).
 *
 * Pinterest uses natural-language keywords in pin descriptions,
 * not hashtags. The pinterestKeywords export covers those.
 */

// --- Instagram Hashtags ---

export const hashtags = {
  evergreen: {
    /** Core brand + region tags. Use 2-3 per post. */
    general: [
      "#napavalley", // ~5M — primary geo tag
      "#sonomacounty", // ~2M — primary geo tag
      "#winecountry", // ~4M — broad but relevant
      "#californiawine", // ~500K — differentiates from global #wine
      "#napavalleylife", // ~200K — lifestyle angle
      "#sonomavalley", // ~400K — Sonoma-specific
      "#napawine", // ~300K — wine-forward
      "#sonomawine", // ~200K — wine-forward
    ],
    /** Travel discovery tags. Use 1-2 per post. */
    travel: [
      "#winecountrytravel", // ~100K — trip planners
      "#napatrip", // ~50K — active planners
      "#winecountryweekend", // ~80K — weekend trip intent
      "#californiatravel", // ~1M — broader CA travel
      "#sfbayarea", // ~500K — catchment area
      "#visitnapavalley", // ~50K — official tourism tag
      "#visitsonomacounty", // ~30K — official tourism tag
    ],
  },

  /** Sub-region tags for geo-targeting. Pick the matching one per entity. */
  byRegion: {
    napa: ["#napavalley", "#downtownnapa", "#visitnapa"],
    yountville: ["#yountville", "#yountvillenapa"],
    "st-helena": ["#sthelena", "#sthelenaca", "#sthelenawineries"],
    rutherford: ["#rutherford", "#rutherfordnapa"],
    oakville: ["#oakville", "#oakvillenapa"],
    calistoga: ["#calistoga", "#calistogawineries", "#calistogaca"],
    "spring-mountain": ["#springmountain", "#springmountaindistrict"],
    carneros: ["#carneros", "#loscarnerros"],
    healdsburg: ["#healdsburg", "#healdsburgca", "#healdsburgwineries"],
    sonoma: ["#sonomaplaza", "#sonomaca", "#sonomatown"],
    "russian-river": ["#russianrivervalley", "#russianriver"],
    "alexander-valley": ["#alexandervalley"],
    "dry-creek": ["#drycreekvalley", "#drycreeksonoma"],
    petaluma: ["#petaluma", "#petalumaca"],
    "glen-ellen": ["#glenellen"],
    kenwood: ["#kenwood", "#kenwoodsonoma"],
    "stags-leap": ["#stagsleapdistrict"],
    "howell-mountain": ["#howellmountain"],
  },

  /**
   * Attribute/theme tags, split by entity type.
   * Hotels and wineries need different tags for the same theme
   * (e.g. #dogfriendlywinery vs #petfriendlyhotel).
   */
  byTheme: {
    "dog-friendly": {
      winery: [
        "#dogfriendlywinery", // ~30K — niche, high intent
        "#winewithdogs",
        "#winedogs",
        "#winerydogs",
      ],
      accommodation: [
        "#petfriendlyhotel",
        "#dogfriendlyhotel",
        "#dogfriendlynapavalley",
        "#dogfriendlysonoma",
      ],
    },
    "kid-friendly": {
      winery: [
        "#familywinecountry",
        "#familyfriendlywinery",
        "#kidfriendlywinery",
        "#napavalleywithkids",
      ],
      accommodation: [
        "#familytravel",
        "#familyfriendlyhotel",
        "#familyvacation",
        "#napavalleyfamily",
      ],
    },
    "adults-only": {
      winery: [
        "#couplesretreat",
        "#datenight",
        "#winedateday",
        "#couplesgetaway",
      ],
      accommodation: [
        "#adultsonlyresort",
        "#couplesgetaway",
        "#romanticgetaway",
        "#honeymoondestination",
      ],
    },
    sustainable: {
      winery: [
        "#sustainablewine",
        "#organicwine",
        "#biodynamicwine",
        "#sustainablevineyards",
      ],
      accommodation: [
        "#ecofriendlyhotel",
        "#sustainabletravel",
        "#greenhotel",
        "#sustainablehospitality",
      ],
    },
    picnic: {
      winery: [
        "#winerypicnic",
        "#vineyardpicnic",
        "#winecountrypicnic",
      ],
      accommodation: [],
    },
    luxury: {
      winery: [
        "#luxurywinecountry",
        "#napavalleyluxury",
        "#luxurywinery",
      ],
      accommodation: [
        "#luxuryhotel",
        "#luxuryresort",
        "#luxurytravel",
      ],
    },
    historic: {
      winery: [
        "#historicwinery",
        "#napawinehistory",
      ],
      accommodation: [
        "#historichotel",
        "#heritagehotel",
      ],
    },
    views: {
      winery: [
        "#vineyardviews",
        "#winecountryviews",
      ],
      accommodation: [
        "#vineyardviews",
        "#hotelwithaview",
      ],
    },
  },

  /** Seasonal/event tags. Layer 1-2 during relevant windows. */
  bySeason: {
    spring: [
      "#napaspring",
      "#winecountryspring",
      "#springinwinecountry",
      "#mustardseason", // Napa mustard blooms Jan-Mar
    ],
    summer: [
      "#napasummer",
      "#winecountrysummer",
      "#summerinnapavalley",
    ],
    harvest: [
      "#harvestseason", // ~200K during Sep-Oct
      "#crushseason",
      "#napacrush",
      "#wineharvest",
      "#harvestinwinecountry",
    ],
    fall: [
      "#napafall",
      "#winecountryfall",
      "#fallinwinecountry",
    ],
    bottlerock: [
      "#bottlerock",
      "#bottlerock2026",
      "#bottlerocknapavalley",
      "#bottlerocknapa",
    ],
    "memorial-day": [
      "#memorialdayweekend",
      "#memorialdaynapa",
      "#mdw2026",
    ],
    "mothers-day": [
      "#mothersdaygift",
      "#mothersdaywinecountry",
      "#mothersdaynapa",
    ],
    winter: [
      "#winterinwinecountry",
      "#napawinter",
      "#winterwinetasting",
    ],
  },

  /** Post-type descriptors, split by entity type. Use 1 per post. */
  byPostType: {
    spotlight: {
      winery: ["#wineryspotlight", "#wineryfeature", "#todayswinery"],
      accommodation: ["#napavalleyhotel", "#sonomahotel", "#winecountrystay"],
    },
    roundup: {
      winery: ["#winecountryguide", "#bestwineries", "#wineryroundup"],
      accommodation: ["#winecountrystay", "#besthotels", "#hotelroundup"],
    },
    "adults-only-series": {
      winery: ["#coupleswinecountry", "#winedateday"],
      accommodation: ["#adultsonlyresort", "#couplesgetaway"],
    },
    "where-to-stay": {
      winery: [], // not applicable — use spotlight instead for wineries
      accommodation: ["#winecountrystay", "#napavacation", "#napahotel"],
    },
  },
} as const;

// --- Pinterest Keywords ---
// Pinterest SEO uses natural-language phrases in pin descriptions.
// These are search terms people actually type on Pinterest.

export const pinterestKeywords = {
  evergreen: [
    "napa valley wineries to visit",
    "best sonoma county wineries",
    "wine country travel guide",
    "napa valley tasting rooms",
    "california wine country trip",
  ],
  byRegion: {
    napa: ["napa valley wineries", "downtown napa wine tasting"],
    yountville: ["yountville wineries", "yountville napa things to do"],
    "st-helena": ["st helena wineries", "st helena napa valley"],
    rutherford: ["rutherford napa wineries", "rutherford cabernet"],
    oakville: ["oakville napa wineries"],
    calistoga: ["calistoga wineries", "calistoga things to do"],
    healdsburg: ["healdsburg wineries", "healdsburg wine tasting"],
    sonoma: ["sonoma plaza wineries", "sonoma wine tasting"],
    "russian-river": ["russian river valley wineries", "russian river pinot noir"],
    "alexander-valley": ["alexander valley wineries"],
    "dry-creek": ["dry creek valley wineries", "dry creek zinfandel"],
  },
  byTheme: {
    "dog-friendly": [
      "dog friendly wineries napa valley",
      "dog friendly wineries sonoma county",
      "pet friendly wine tasting california",
    ],
    "kid-friendly": [
      "family friendly wineries napa",
      "napa valley with kids",
      "kid friendly wine country activities",
    ],
    "adults-only": [
      "romantic napa valley getaway",
      "couples weekend napa valley",
      "adults only wine country retreat",
      "honeymoon napa valley",
    ],
    sustainable: [
      "organic wineries napa valley",
      "sustainable wineries california",
      "biodynamic wine napa sonoma",
    ],
    picnic: [
      "picnic wineries napa valley",
      "best winery picnic spots sonoma",
      "wine country picnic ideas",
    ],
  },
  bySeason: {
    spring: ["napa valley spring visit", "wine country spring trip"],
    summer: ["summer in napa valley", "napa valley summer guide"],
    harvest: ["napa valley harvest season", "wine country crush season when to visit"],
    fall: ["napa valley fall colors", "wine country fall trip"],
    bottlerock: ["bottlerock 2026 wineries nearby", "bottlerock napa what to do"],
    "memorial-day": ["memorial day weekend napa valley", "memorial day wine country"],
  },
  byPostType: {
    spotlight: ["best wineries napa valley 2026", "must visit wineries sonoma"],
    roundup: ["top 10 napa wineries", "best wineries near healdsburg"],
    "where-to-stay": [
      "where to stay napa valley",
      "best hotels napa valley",
      "napa valley bed and breakfast",
      "sonoma county boutique hotels",
    ],
  },
} as const;

// --- Helpers ---

type SeasonKey = keyof typeof hashtags.bySeason;
type ThemeKey = keyof typeof hashtags.byTheme;
type RegionKey = keyof typeof hashtags.byRegion;

/**
 * Build a hashtag string for an Instagram caption.
 * Instagram limits posts to 5 hashtags (2025 policy).
 * Priority: 1 evergreen + 1 regional + 1-2 thematic + 1 branded.
 */
export function buildInstagramHashtags(opts: {
  entityType: "winery" | "accommodation";
  region?: string;
  themes?: string[];
  season?: SeasonKey;
  postType?: keyof typeof hashtags.byPostType;
  valley?: "napa" | "sonoma";
}): string {
  const tags: string[] = [];
  const et = opts.entityType;

  // 1 evergreen — pick based on valley
  if (opts.valley === "sonoma") {
    tags.push("#sonomacounty");
  } else {
    tags.push("#napavalley");
  }

  // 1 regional (sub-region or city)
  const regionKey = normalizeRegion(opts.region);
  if (regionKey && hashtags.byRegion[regionKey]) {
    tags.push(hashtags.byRegion[regionKey][0]);
  }

  // 1-2 thematic (first matching theme — entity-type-aware)
  for (const theme of opts.themes ?? []) {
    const themeKey = normalizeTheme(theme);
    if (themeKey && hashtags.byTheme[themeKey]) {
      const themeTags = hashtags.byTheme[themeKey][et];
      const first = themeTags?.[0];
      if (first) {
        tags.push(first);
        if (tags.length >= 4) break; // leave room for branded tag
      }
    }
  }

  // If no theme filled a slot, try seasonal or post type
  if (tags.length < 4) {
    if (opts.season && hashtags.bySeason[opts.season]) {
      const seasonTag = hashtags.bySeason[opts.season][0];
      if (seasonTag) tags.push(seasonTag);
    } else if (opts.postType && hashtags.byPostType[opts.postType]) {
      const postTags = hashtags.byPostType[opts.postType][et];
      const first = postTags?.[0];
      if (first) {
        tags.push(first);
      } else {
        tags.push("#winecountry");
      }
    } else {
      tags.push("#winecountry");
    }
  }

  // Always end with branded tag
  tags.push("#napasonomaguide");

  // Dedupe and cap at 5
  const unique = [...new Set(tags)].slice(0, 5);
  return unique.join(" ");
}

/**
 * Build Pinterest keyword phrases for a pin description.
 * Returns 2-3 natural-language phrases.
 */
export function buildPinterestKeywords(opts: {
  entityType: "winery" | "accommodation";
  region?: string;
  themes?: string[];
  postType?: keyof typeof pinterestKeywords.byPostType;
  valley?: "napa" | "sonoma";
}): string[] {
  const phrases: string[] = [];

  // 1 evergreen — valley + entity-type appropriate
  if (opts.entityType === "accommodation") {
    phrases.push(
      opts.valley === "sonoma"
        ? "sonoma county hotels"
        : "where to stay napa valley"
    );
  } else {
    phrases.push(
      opts.valley === "sonoma"
        ? "best sonoma county wineries"
        : "napa valley wineries to visit"
    );
  }

  // 1 regional
  const regionKey = normalizeRegion(opts.region);
  if (regionKey && pinterestKeywords.byRegion[regionKey as keyof typeof pinterestKeywords.byRegion]) {
    phrases.push(pinterestKeywords.byRegion[regionKey as keyof typeof pinterestKeywords.byRegion][0]);
  }

  // 1 thematic
  for (const theme of opts.themes ?? []) {
    const themeKey = normalizeTheme(theme);
    if (themeKey && pinterestKeywords.byTheme[themeKey as keyof typeof pinterestKeywords.byTheme]) {
      phrases.push(pinterestKeywords.byTheme[themeKey as keyof typeof pinterestKeywords.byTheme][0]);
    }
  }

  return [...new Set(phrases)].slice(0, 3);
}

/** Map city/subregion names to region keys */
function normalizeRegion(region?: string): RegionKey | null {
  if (!region) return null;
  const lower = region.toLowerCase().trim();

  const mapping: Record<string, RegionKey> = {
    napa: "napa",
    yountville: "yountville",
    "st. helena": "st-helena",
    "st helena": "st-helena",
    "saint helena": "st-helena",
    rutherford: "rutherford",
    oakville: "oakville",
    calistoga: "calistoga",
    healdsburg: "healdsburg",
    sonoma: "sonoma",
    "russian river valley": "russian-river",
    "russian river": "russian-river",
    "alexander valley": "alexander-valley",
    "dry creek valley": "dry-creek",
    "dry creek": "dry-creek",
    petaluma: "petaluma",
    "glen ellen": "glen-ellen",
    kenwood: "kenwood",
    "stags leap district": "stags-leap",
    "stags leap": "stags-leap",
    "howell mountain": "howell-mountain",
    "spring mountain": "spring-mountain",
    carneros: "carneros",
  };

  return mapping[lower] ?? null;
}

/** Map attribute labels to theme keys */
function normalizeTheme(theme: string): ThemeKey | null {
  const lower = theme.toLowerCase().trim();
  const mapping: Record<string, ThemeKey> = {
    "dog-friendly": "dog-friendly",
    "dog friendly": "dog-friendly",
    "kid-friendly": "kid-friendly",
    "kid friendly": "kid-friendly",
    "adults-only": "adults-only",
    "adults only": "adults-only",
    sustainable: "sustainable",
    picnic: "picnic",
    "picnic-friendly": "picnic",
    luxury: "luxury",
    historic: "historic",
    views: "views",
  };
  return mapping[lower] ?? null;
}
