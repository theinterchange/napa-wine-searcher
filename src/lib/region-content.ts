export interface ValleyContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroSubtitle: string;
  editorial: string[];
  bestTimeToVisit: string;
  faq: { question: string; answer: string }[];
}

export interface SubRegionContent {
  description: string[];
  knownFor: string[];
  bestTimeToVisit: string;
  terroir: string;
  signatureVarietal: string;
}

export const VALLEY_CONTENT: Record<"napa" | "sonoma", ValleyContent> = {
  napa: {
    title: "Napa Valley Wineries",
    metaTitle: "Best Wineries in Napa Valley | Complete 2026 Guide",
    metaDescription:
      "Discover 110+ wineries across 10 Napa Valley sub-regions. Browse top-rated tasting rooms, compare prices, and plan your Napa wine country visit.",
    heroSubtitle:
      "From the iconic Cabernet Sauvignons of Oakville and Rutherford to the sparkling wines of Carneros, explore every corner of America's most celebrated wine region.",
    editorial: [
      "Napa Valley has been the heart of American winemaking since the landmark 1976 Judgment of Paris, when Napa wines outperformed their French counterparts in a blind tasting. Today, the valley stretches 30 miles from the cool, fog-kissed Carneros in the south to the sun-drenched slopes of Calistoga in the north, producing world-class wines across a remarkable diversity of microclimates and terroirs.",
      "What makes Napa special is its concentration of excellence. The valley floor's deep alluvial soils, the volcanic hillsides of Howell Mountain and Atlas Peak, and the benchland terraces of Oakville and Rutherford each contribute distinct character to the wines. Cabernet Sauvignon is king here, but you'll also find exceptional Chardonnay, Merlot, and Sauvignon Blanc.",
      "Whether you're seeking a grand estate experience at a storied First Growth or an intimate tasting at a family-run boutique winery, Napa Valley delivers. Many wineries require reservations, especially during harvest season (August through October), so planning ahead is essential for the best experience.",
    ],
    bestTimeToVisit:
      "April through November. Harvest season (August-October) is the most exciting time, while spring offers wildflowers and fewer crowds.",
    faq: [
      {
        question: "How much does a wine tasting cost in Napa Valley?",
        answer:
          "Tasting fees in Napa Valley typically range from $25 to $150+, with the average around $50-75. Many wineries waive the tasting fee with a wine purchase. Budget-friendly options under $40 exist, especially in Calistoga and along the Silverado Trail.",
      },
      {
        question:
          "Do I need reservations for Napa Valley wineries?",
        answer:
          "Most Napa Valley wineries require or strongly recommend reservations, especially on weekends and during harvest season (August-October). A few wineries accept walk-ins, but booking ahead ensures you get the experience you want.",
      },
      {
        question: "How many wineries can you visit in a day in Napa Valley?",
        answer:
          "Plan for 3-4 wineries per day to have an enjoyable, unhurried experience. Each tasting typically takes 45-90 minutes, plus driving time between stops. Starting early (10 AM) and spacing visits helps you savor each winery.",
      },
      {
        question:
          "Which Napa Valley sub-region is best for Cabernet Sauvignon?",
        answer:
          "Oakville and Rutherford are legendary for Cabernet Sauvignon, producing some of Napa's most sought-after bottles. Stags Leap District is known for elegant, silky Cabernets, while Howell Mountain produces powerful, structured mountain Cabs.",
      },
      {
        question: "Are Napa Valley wineries dog-friendly?",
        answer:
          "Some Napa Valley wineries welcome well-behaved dogs, typically in outdoor tasting areas and patios. Policies vary by winery, so always check ahead. Our guide flags which wineries are confirmed dog-friendly.",
      },
      {
        question: "What is the best time to visit Napa Valley?",
        answer:
          "The best time to visit Napa Valley is April through November. Harvest season (August-October) offers grape picking and crush activities, while spring brings wildflowers and comfortable temperatures. Summer can be hot, so plan indoor tastings midday.",
      },
    ],
  },
  sonoma: {
    title: "Sonoma County Wineries",
    metaTitle: "Best Wineries in Sonoma County | Complete 2026 Guide",
    metaDescription:
      "Explore 75+ wineries across 7 Sonoma County regions. From Russian River Valley Pinot Noir to Dry Creek Valley Zinfandel, plan your Sonoma wine country visit.",
    heroSubtitle:
      "From the world-class Pinot Noirs of Russian River Valley to the heritage Zinfandels of Dry Creek, discover Sonoma's laid-back charm and extraordinary diversity.",
    editorial: [
      "Sonoma County is California wine country's best-kept open secret. While Napa Valley draws the spotlight, Sonoma's sprawling 1,768 square miles of diverse terrain produce wines of equal quality with a distinctly more relaxed, approachable atmosphere. From fog-cooled coastal vineyards to sun-drenched inland valleys, Sonoma's geographic diversity is unmatched in California.",
      "The region's calling card is Pinot Noir, particularly from the Russian River Valley and Sonoma Coast, where cool marine fog produces wines of remarkable elegance and complexity. But Sonoma is equally renowned for its Chardonnay, old-vine Zinfandel from Dry Creek Valley, and bold Cabernet Sauvignon from Alexander Valley. This diversity means every palate finds something to love.",
      "Sonoma's tasting culture tends toward the casual and welcoming. Many wineries are family-owned, and you're likely to be poured by the winemaker themselves. Tasting fees are generally more affordable than Napa, and walk-ins are more common, making Sonoma an ideal destination for both first-time visitors and seasoned wine enthusiasts.",
    ],
    bestTimeToVisit:
      "May through October. Sonoma's coastal influence keeps temperatures moderate year-round, making it enjoyable even in winter months.",
    faq: [
      {
        question: "How much does a wine tasting cost in Sonoma County?",
        answer:
          "Sonoma County tastings typically range from $20 to $75, with many options under $40. This makes Sonoma generally more affordable than neighboring Napa Valley. Many wineries offer fee waivers with a bottle purchase.",
      },
      {
        question: "Do Sonoma wineries require reservations?",
        answer:
          "Sonoma County is more walk-in friendly than Napa, though reservations are still recommended for weekends and popular wineries. Many smaller, family-owned wineries welcome drop-ins during tasting hours.",
      },
      {
        question: "What is Sonoma County best known for?",
        answer:
          "Sonoma County is renowned for its Pinot Noir (especially from Russian River Valley), Chardonnay, old-vine Zinfandel (Dry Creek Valley), and Cabernet Sauvignon (Alexander Valley). The region's diverse microclimates support an exceptional range of grape varieties.",
      },
      {
        question: "What is the difference between Napa Valley and Sonoma County?",
        answer:
          "Napa Valley is a single narrow valley focused heavily on Cabernet Sauvignon, with generally higher tasting fees and a more formal atmosphere. Sonoma County is much larger with more diverse terrain and grape varieties, more affordable tastings, and a more casual, rustic vibe.",
      },
      {
        question: "Are Sonoma wineries family-friendly?",
        answer:
          "Many Sonoma County wineries are family-friendly, with outdoor areas, picnic grounds, and relaxed atmospheres where children are welcome. Some offer grape juice tastings for kids. Check individual winery policies for specifics.",
      },
      {
        question: "How do I get around Sonoma wine country?",
        answer:
          "Sonoma County is larger and more spread out than Napa, so a car (or designated driver) is essential. The main wine regions are within 30-60 minutes of each other. Consider focusing on one sub-region per day for the best experience.",
      },
    ],
  },
};

export const SUBREGION_CONTENT: Record<string, SubRegionContent> = {
  // Napa sub-regions
  calistoga: {
    description: [
      "Calistoga sits at the northern end of Napa Valley, where volcanic soils and the warmest temperatures in the valley produce bold, concentrated wines. The town itself is famous for its hot springs, mud baths, and Old Faithful Geyser, making it a unique destination that pairs wine with wellness.",
      "The AVA's volcanic ash and tufa soils lend a distinctive mineral character to its wines, particularly Cabernet Sauvignon and Petite Sirah. Vineyards here benefit from the warm days and cool nights created by the Palisades mountain range.",
    ],
    knownFor: ["Cabernet Sauvignon", "Petite Sirah", "Zinfandel"],
    bestTimeToVisit: "Spring and fall for comfortable temperatures; summer can be quite hot",
    terroir: "Volcanic ash and tufa soils with warm days and significant diurnal temperature shifts",
    signatureVarietal: "Cabernet Sauvignon",
  },
  "st-helena": {
    description: [
      "St. Helena is the charming heart of Napa Valley, a walkable town lined with tasting rooms, boutiques, and restaurants along its historic Main Street. Some of Napa's most iconic wineries call this area home, and the benchland vineyards on either side of the valley floor produce exceptional wines.",
      "The region benefits from warm, consistent temperatures moderated by afternoon breezes from the Mayacamas Mountains to the west. The deep, well-drained alluvial soils are ideal for Cabernet Sauvignon, which develops rich, complex flavors in this favored location.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc"],
    bestTimeToVisit: "Year-round; the town itself offers indoor activities during any season",
    terroir: "Alluvial benchland soils with warm days and mountain-influenced breezes",
    signatureVarietal: "Cabernet Sauvignon",
  },
  rutherford: {
    description: [
      "Rutherford is the birthplace of the concept of Napa Valley terroir, famous for what winemaker Andre Tchelistcheff called 'Rutherford Dust' — a distinctive cocoa-and-earth quality that marks the best Cabernet Sauvignons from this area. It's a compact AVA with an outsized reputation.",
      "Home to legendary estates that helped establish Napa's global reputation, Rutherford's benchland vineyards on the western alluvial fans produce some of the most collectible wines in California. The area's warm temperatures and well-drained gravelly soils are tailor-made for Cabernet.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot"],
    bestTimeToVisit: "Spring through fall",
    terroir: "Gravelly alluvial fans with the signature 'Rutherford Dust' mineral character",
    signatureVarietal: "Cabernet Sauvignon",
  },
  oakville: {
    description: [
      "Oakville is widely considered the single greatest appellation for Cabernet Sauvignon in the New World. This small AVA in the center of Napa Valley produces wines of extraordinary depth and complexity, and its vineyards command some of the highest land prices in American agriculture.",
      "The Oakville bench — a gently sloping terrace on the valley's west side — provides ideal drainage and exposure for Cabernet Sauvignon. The area's gravel-loam soils, warm daytime temperatures, and cooling afternoon breezes create conditions that consistently produce world-class red wines.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc"],
    bestTimeToVisit: "Spring and fall for the most pleasant weather",
    terroir: "Gravel-loam benchland soils with ideal sun exposure and afternoon cooling",
    signatureVarietal: "Cabernet Sauvignon",
  },
  yountville: {
    description: [
      "Yountville is Napa Valley's culinary capital, home to multiple Michelin-starred restaurants and a vibrant food scene that makes it the perfect base for a wine country visit. The compact, walkable town punches well above its weight in both dining and tasting experiences.",
      "Slightly cooler than regions to the north, Yountville's moderate temperatures and clay-loam soils produce elegant, food-friendly wines. While Cabernet Sauvignon thrives here, the area also excels with Merlot and Chardonnay, reflecting its transitional climate.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot", "Chardonnay"],
    bestTimeToVisit: "Year-round; the culinary scene is excellent in every season",
    terroir: "Clay-loam soils with moderate temperatures and cooling San Pablo Bay influence",
    signatureVarietal: "Cabernet Sauvignon",
  },
  "stags-leap-district": {
    description: [
      "Stags Leap District earned its place in wine history when its Cabernet Sauvignon triumphed at the legendary 1976 Judgment of Paris, forever changing the global perception of California wine. Today, the district continues to produce some of the most elegant and age-worthy Cabernets in Napa Valley.",
      "Tucked into a pocket on the eastern side of the valley, the district is defined by dramatic volcanic palisades that trap afternoon heat while allowing cool evening breezes to flow through. This unique geography produces Cabernets known for their silky tannins and distinctive cherry-iron character.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot"],
    bestTimeToVisit: "Spring through fall; dramatic palisade views year-round",
    terroir: "Volcanic and alluvial soils in a sheltered eastern valley pocket with distinctive microclimate",
    signatureVarietal: "Cabernet Sauvignon",
  },
  "atlas-peak": {
    description: [
      "Atlas Peak is one of Napa Valley's most dramatic mountain appellations, with vineyards planted between 760 and 2,600 feet above sea level. Above the fog line, these high-altitude vineyards receive intense sunlight and cooler nighttime temperatures, producing deeply concentrated wines.",
      "The volcanic soils here are thin and rocky, forcing vines to struggle for nutrients — which winemakers prize for the concentrated, mineral-driven wines it produces. Atlas Peak Cabernet Sauvignon is known for its firm structure, dark fruit, and remarkable aging potential.",
    ],
    knownFor: ["Cabernet Sauvignon", "Chardonnay"],
    bestTimeToVisit: "Late spring through early fall for mountain access",
    terroir: "High-elevation volcanic soils above the fog line with intense sun exposure",
    signatureVarietal: "Cabernet Sauvignon",
  },
  "mount-veeder": {
    description: [
      "Mount Veeder rises along the western edge of Napa Valley in the Mayacamas Mountains, producing some of the valley's most powerful and complex mountain wines. Vineyards here are planted on steep, rugged terrain that was first planted in the 1860s, making it one of Napa's oldest winegrowing areas.",
      "The thin, well-drained soils and high elevation produce small berries with intense concentration. Mount Veeder Cabernets are renowned for their tannic structure, dark fruit intensity, and extraordinary longevity — wines that reward patience.",
    ],
    knownFor: ["Cabernet Sauvignon", "Malbec", "Chardonnay"],
    bestTimeToVisit: "Late spring through early fall; mountain roads can be challenging in winter",
    terroir: "Steep mountain terrain with thin volcanic soils at 400-2,600 feet elevation",
    signatureVarietal: "Cabernet Sauvignon",
  },
  "carneros-napa": {
    description: [
      "Los Carneros (Napa side) is the coolest region in Napa Valley, sitting at the valley's southern gateway where cold winds and fog roll in from San Pablo Bay. This maritime influence makes it the premier spot in Napa for cool-climate varieties, particularly Chardonnay and Pinot Noir.",
      "The region's shallow clay soils and persistent wind stress the vines just enough to produce small, intensely flavored grapes. Carneros is also the source of many of Napa's finest sparkling wines, with several major sparkling houses choosing this area for their base wines.",
    ],
    knownFor: ["Pinot Noir", "Chardonnay", "Sparkling Wine"],
    bestTimeToVisit: "Summer and early fall when fog burns off to reveal beautiful bay views",
    terroir: "Shallow clay soils with strong maritime influence from San Pablo Bay",
    signatureVarietal: "Pinot Noir",
  },
  "howell-mountain": {
    description: [
      "Howell Mountain was one of the first sub-regions in Napa Valley to be recognized as distinctive, earning its AVA status in 1983. Sitting above 1,400 feet on the eastern side of the valley, its vineyards rise above the fog line into constant sunshine, producing intensely concentrated wines.",
      "The volcanic soils, high elevation, and ample sunlight create Cabernet Sauvignons and Merlots of remarkable power and structure. Howell Mountain wines are known for their dense, chewy tannins and flavors of dark fruit, iron, and mountain herbs.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot", "Zinfandel"],
    bestTimeToVisit: "Late spring through fall; limited winery access — plan ahead",
    terroir: "Volcanic red clay soils above 1,400 feet with full sun exposure above the fog line",
    signatureVarietal: "Cabernet Sauvignon",
  },

  // Sonoma sub-regions
  "russian-river-valley": {
    description: [
      "Russian River Valley is one of the world's great Pinot Noir regions, producing wines that rival the finest Burgundies. The river itself creates a natural corridor for Pacific fog to funnel inland each evening, creating the dramatic diurnal temperature swings that Pinot Noir and Chardonnay thrive on.",
      "From the Green Valley pocket in the west to the warmer eastern reaches near Healdsburg, the region offers remarkable diversity within a single AVA. Whether you prefer bright, energetic Pinots or richer, more opulent styles, Russian River Valley delivers with extraordinary consistency.",
    ],
    knownFor: ["Pinot Noir", "Chardonnay", "Zinfandel"],
    bestTimeToVisit: "June through October; morning fog clears to warm afternoons",
    terroir: "Goldridge sandy loam soils with heavy fog influence from the Pacific via the river corridor",
    signatureVarietal: "Pinot Noir",
  },
  "sonoma-valley": {
    description: [
      "Sonoma Valley is where California winemaking began — the site of the state's first commercial winery and the historic 1857 Buena Vista estate. The valley runs north-south between the Sonoma and Mayacamas mountain ranges, creating a diverse range of elevations and exposures.",
      "The town of Sonoma anchors the southern end with its charming plaza and tasting rooms, while Glen Ellen and Kenwood further north offer more rural, vineyard-centric experiences. The region produces excellent Cabernet Sauvignon, Zinfandel, and increasingly impressive Rhone varieties.",
    ],
    knownFor: ["Cabernet Sauvignon", "Zinfandel", "Chardonnay"],
    bestTimeToVisit: "Year-round; the historic town of Sonoma is enjoyable in every season",
    terroir: "Diverse valley-floor and hillside vineyards between two mountain ranges",
    signatureVarietal: "Zinfandel",
  },
  "dry-creek-valley": {
    description: [
      "Dry Creek Valley is Zinfandel's spiritual home in California, with old-vine plantings dating back over a century. This narrow valley northwest of Healdsburg produces Zinfandels of extraordinary depth and character, often from gnarled, head-pruned vines that are among the oldest in the state.",
      "Beyond its famous Zinfandels, Dry Creek Valley also produces excellent Sauvignon Blanc and increasingly impressive Cabernet Sauvignon. The valley's warm, sheltered climate and gravelly benchland soils are ideal for these varieties, and the small-production, family-owned wineries here offer some of Sonoma's most personal tasting experiences.",
    ],
    knownFor: ["Zinfandel", "Sauvignon Blanc", "Cabernet Sauvignon"],
    bestTimeToVisit: "Spring through fall; the narrow valley is especially scenic",
    terroir: "Gravelly benchland and rocky hillside soils with warm, sheltered conditions",
    signatureVarietal: "Zinfandel",
  },
  "alexander-valley": {
    description: [
      "Alexander Valley is Sonoma County's warmest major wine region, making it the go-to appellation for bold, ripe Cabernet Sauvignon. The valley stretches along the upper Russian River northeast of Healdsburg, with benchland and hillside vineyards that capture long hours of sunshine.",
      "While Cabernet is the star, Alexander Valley also produces excellent Merlot, Chardonnay, and Sauvignon Blanc. The region's larger estates and scenic, rolling hills make for dramatic vineyard views, and its slightly off-the-beaten-path location means a more relaxed tasting experience.",
    ],
    knownFor: ["Cabernet Sauvignon", "Merlot", "Chardonnay"],
    bestTimeToVisit: "Spring and fall; summers can be warm",
    terroir: "Warm benchland and hillside vineyards along the upper Russian River",
    signatureVarietal: "Cabernet Sauvignon",
  },
  "bennett-valley": {
    description: [
      "Bennett Valley is one of Sonoma County's hidden gems — a small, wind-cooled valley nestled between Sonoma Mountain and Taylor Mountain. The Petaluma Gap wind corridor funnels Pacific breezes through the valley each afternoon, creating one of Sonoma's coolest growing conditions.",
      "This cooling influence makes Bennett Valley ideal for aromatic white varieties and elegant reds. The region's Merlot, Chardonnay, and Sauvignon Blanc have been gaining recognition, and the handful of wineries here offer an intimate, uncrowded alternative to more visited areas.",
    ],
    knownFor: ["Merlot", "Chardonnay", "Sauvignon Blanc"],
    bestTimeToVisit: "Summer and early fall for the best weather",
    terroir: "Wind-cooled valley with volcanic soils between two mountain ranges",
    signatureVarietal: "Merlot",
  },
  "carneros-sonoma": {
    description: [
      "The Sonoma side of the Carneros appellation shares the same cool, wind-swept character as its Napa counterpart, with expansive views across the marshlands to San Pablo Bay. This is prime territory for Pinot Noir, Chardonnay, and sparkling wine.",
      "Several of Sonoma's most celebrated sparkling wine houses are based here, taking advantage of the cool climate to produce crisp, elegant base wines. The rolling, open landscape is strikingly different from Sonoma's forested valleys to the north, with a wild, windswept beauty all its own.",
    ],
    knownFor: ["Pinot Noir", "Chardonnay", "Sparkling Wine"],
    bestTimeToVisit: "Late summer through fall when bay breezes moderate the heat",
    terroir: "Shallow clay soils with persistent maritime wind and fog from San Pablo Bay",
    signatureVarietal: "Pinot Noir",
  },
  "petaluma-gap": {
    description: [
      "Petaluma Gap is Sonoma County's newest AVA, recognized in 2017 for its defining feature: a gap in the coastal mountain range that channels powerful Pacific winds directly into the growing area. These persistent winds stress the vines and produce grapes with intense flavor concentration.",
      "The wind is so consistent that it's actually shaped the trees — you can see them permanently bent by the prevailing breeze. This extreme maritime influence produces Pinot Noirs of great intensity and structure, along with crisp Chardonnays and aromatic Syrahs that stand out for their cool-climate elegance.",
    ],
    knownFor: ["Pinot Noir", "Chardonnay", "Syrah"],
    bestTimeToVisit: "Late summer and fall; spring can be quite windy",
    terroir: "Wind-swept terrain with a coastal mountain gap channeling Pacific marine influence",
    signatureVarietal: "Pinot Noir",
  },
};
