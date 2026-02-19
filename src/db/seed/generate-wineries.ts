// Script to generate wineries seed data (skips curated wineries)
import { writeFileSync } from "fs";
import { curatedWineries } from "./data/curated-wineries";

const curatedSlugs = new Set(curatedWineries.map((w) => w.slug));

const wineryDefinitions = [
  // NAPA - Calistoga (6)
  { name: "Chateau Montelena", slug: "chateau-montelena", sub: "calistoga", city: "Calistoga", lat: 38.5867, lng: -122.6156, price: 4, desc: "Legendary estate that put California wine on the world stage at the 1976 Judgment of Paris.", short: "Historic estate famous for the 1976 Judgment of Paris.", web: "https://www.montelena.com", res: true, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Chardonnay", "Zinfandel"] },
  { name: "Sterling Vineyards", slug: "sterling-vineyards", sub: "calistoga", city: "Calistoga", lat: 38.5789, lng: -122.5828, price: 3, desc: "Mountaintop winery accessible by aerial tram with panoramic views of Napa Valley.", short: "Iconic hilltop winery with aerial tram access.", web: "https://www.sterlingvineyards.com", res: false, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Chardonnay"] },
  { name: "Castello di Amorosa", slug: "castello-di-amorosa", sub: "calistoga", city: "Calistoga", lat: 38.5617, lng: -122.5444, price: 3, desc: "Authentically built 13th-century Tuscan castle and winery featuring Italian varietals and blends.", short: "A 13th-century Tuscan castle winery in Calistoga.", web: "https://www.castellodiamorosa.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Pinot Grigio", "Red Blend"] },
  { name: "Clos Pegase", slug: "clos-pegase", sub: "calistoga", city: "Calistoga", lat: 38.5628, lng: -122.5639, price: 3, desc: "Art-inspired winery designed by architect Michael Graves with an extensive art collection.", short: "Art-focused winery with striking architecture.", web: "https://www.clospegase.com", res: true, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Merlot", "Chardonnay", "Sauvignon Blanc"] },
  { name: "Schramsberg Vineyards", slug: "schramsberg-vineyards", sub: "calistoga", city: "Calistoga", lat: 38.5722, lng: -122.5339, price: 3, desc: "America's premier sparkling wine producer with historic caves dating to 1862.", short: "Premier sparkling wine house with historic caves.", web: "https://www.schramsberg.com", res: true, dog: false, picnic: false, wines: ["Brut", "Blanc de Blancs", "Sparkling Rosé"] },
  { name: "Vermeil Wines", slug: "vermeil-wines", sub: "calistoga", city: "Calistoga", lat: 38.5789, lng: -122.5794, price: 2, desc: "Founded by legendary NFL coach Dick Vermeil, focusing on Napa Valley Cabernet and Merlot.", short: "NFL coach's passion project producing bold reds.", web: "https://www.vermeilwines.com", res: false, dog: true, picnic: true, wines: ["Cabernet Sauvignon", "Merlot", "Red Blend"] },
  // NAPA - St. Helena (8)
  { name: "Beringer Vineyards", slug: "beringer-vineyards", sub: "st-helena", city: "St. Helena", lat: 38.5147, lng: -122.4700, price: 3, desc: "Napa's oldest continuously operating winery, founded in 1876, with stunning Rhine House.", short: "Napa's oldest continuously operating winery since 1876.", web: "https://www.beringer.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Chardonnay", "Merlot", "Sauvignon Blanc"] },
  { name: "Charles Krug Winery", slug: "charles-krug", sub: "st-helena", city: "St. Helena", lat: 38.5233, lng: -122.4697, price: 3, desc: "Founded in 1861 by Charles Krug, the oldest winery in Napa Valley, now run by the Peter Mondavi family.", short: "Napa Valley's first winery, established 1861.", web: "https://www.charleskrug.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc", "Pinot Noir"] },
  { name: "V. Sattui Winery", slug: "v-sattui", sub: "st-helena", city: "St. Helena", lat: 38.4997, lng: -122.4569, price: 2, desc: "Family-owned winery with a gourmet deli and beautiful picnic grounds along Highway 29.", short: "Family winery with beloved deli and picnic grounds.", web: "https://www.vsattui.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Riesling", "Zinfandel", "Red Blend"] },
  { name: "Duckhorn Vineyards", slug: "duckhorn-vineyards", sub: "st-helena", city: "St. Helena", lat: 38.5189, lng: -122.4528, price: 4, desc: "One of Napa's most acclaimed producers, known for exceptional Merlot and estate Cabernet.", short: "Premier Merlot producer with estate vineyards.", web: "https://www.duckhorn.com", res: true, dog: false, picnic: false, wines: ["Merlot", "Cabernet Sauvignon", "Sauvignon Blanc"] },
  { name: "Hall Wines", slug: "hall-wines", sub: "st-helena", city: "St. Helena", lat: 38.4947, lng: -122.4386, price: 4, desc: "Modern estate with iconic Bunny Foo Foo sculpture, producing world-class Cabernet Sauvignon.", short: "Art-filled modern estate with iconic sculpture.", web: "https://www.hallwines.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc"] },
  { name: "Markham Vineyards", slug: "markham-vineyards", sub: "st-helena", city: "St. Helena", lat: 38.5100, lng: -122.4689, price: 2, desc: "Historic stone winery offering approachable, well-priced wines in a relaxed setting.", short: "Historic stone winery with approachable wines.", web: "https://www.markhamvineyards.com", res: false, dog: false, picnic: true, wines: ["Merlot", "Cabernet Sauvignon", "Chardonnay"] },
  { name: "Trinchero Napa Valley", slug: "trinchero-napa-valley", sub: "st-helena", city: "St. Helena", lat: 38.5078, lng: -122.4700, price: 3, desc: "The family behind Sutter Home, now crafting premium Napa Valley wines from estate vineyards.", short: "Sutter Home family's premium Napa portfolio.", web: "https://www.trinchero.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Petite Sirah", "Red Blend"] },
  { name: "Merryvale Vineyards", slug: "merryvale-vineyards", sub: "st-helena", city: "St. Helena", lat: 38.5067, lng: -122.4694, price: 3, desc: "Boutique producer in a historic stone building offering premium wines and intimate tastings.", short: "Boutique winery in a charming historic building.", web: "https://www.merryvale.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Chardonnay", "Red Blend"] },
  // NAPA - Rutherford (6)
  { name: "Inglenook", slug: "inglenook", sub: "rutherford", city: "Rutherford", lat: 38.4628, lng: -122.4169, price: 4, desc: "Francis Ford Coppola's iconic estate, formerly Niebaum-Coppola, producing world-class Rubicon.", short: "Coppola's iconic estate producing legendary Rubicon.", web: "https://www.inglenook.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Red Blend", "Cabernet Franc"] },
  { name: "Caymus Vineyards", slug: "caymus-vineyards", sub: "rutherford", city: "Rutherford", lat: 38.4617, lng: -122.4250, price: 4, desc: "Renowned for their Special Selection Cabernet Sauvignon, one of Napa's most collected wines.", short: "Iconic producer of highly sought Cabernet Sauvignon.", web: "https://www.caymus.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon"] },
  { name: "Frog's Leap Winery", slug: "frogs-leap", sub: "rutherford", city: "Rutherford", lat: 38.4567, lng: -122.4239, price: 3, desc: "Certified organic winery with a playful spirit, beautiful gardens, and excellent Sauvignon Blanc.", short: "Playful organic winery with beautiful gardens.", web: "https://www.frogsleap.com", res: true, dog: false, picnic: true, wines: ["Sauvignon Blanc", "Cabernet Sauvignon", "Zinfandel", "Merlot"] },
  { name: "Mumm Napa", slug: "mumm-napa", sub: "rutherford", city: "Rutherford", lat: 38.4456, lng: -122.4097, price: 2, desc: "Premier sparkling wine house offering tastings on a scenic terrace with vineyard views.", short: "Top sparkling wine house with vineyard terrace.", web: "https://www.mummnapa.com", res: false, dog: false, picnic: false, wines: ["Brut", "Blanc de Blancs", "Sparkling Rosé", "Rosé"] },
  { name: "Rutherford Hill Winery", slug: "rutherford-hill", sub: "rutherford", city: "Rutherford", lat: 38.4578, lng: -122.4028, price: 3, desc: "Hillside estate known for excellent Merlot and extensive wine cave tours.", short: "Hillside estate with extensive wine caves.", web: "https://www.rutherfordhill.com", res: true, dog: false, picnic: true, wines: ["Merlot", "Cabernet Sauvignon", "Sauvignon Blanc"] },
  { name: "Provenance Vineyards", slug: "provenance-vineyards", sub: "rutherford", city: "Rutherford", lat: 38.4589, lng: -122.4197, price: 3, desc: "Small-lot producer focused on showcasing the distinct terroir of Rutherford benchlands.", short: "Small-lot producer showcasing Rutherford terroir.", web: "https://www.provenancevineyards.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc"] },
  // NAPA - Oakville (6)
  { name: "Robert Mondavi Winery", slug: "robert-mondavi", sub: "oakville", city: "Oakville", lat: 38.4300, lng: -122.4094, price: 3, desc: "The winery that pioneered modern Napa Valley, offering world-class tours and tastings.", short: "Pioneer of modern Napa Valley winemaking.", web: "https://www.robertmondavi.com", res: false, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Sauvignon Blanc", "Pinot Noir", "Chardonnay"] },
  { name: "Opus One", slug: "opus-one", sub: "oakville", city: "Oakville", lat: 38.4317, lng: -122.4078, price: 4, desc: "The legendary Bordeaux-style blend born from the partnership of Mondavi and Baron Philippe de Rothschild.", short: "Legendary Mondavi-Rothschild Bordeaux-style partnership.", web: "https://www.opusonewinery.com", res: true, dog: false, picnic: false, wines: ["Red Blend"] },
  { name: "Silver Oak Cellars", slug: "silver-oak", sub: "oakville", city: "Oakville", lat: 38.4297, lng: -122.4031, price: 4, desc: "Dedicated exclusively to Cabernet Sauvignon, producing velvety, American oak-aged wines.", short: "Cabernet Sauvignon specialists aged in American oak.", web: "https://www.silveroak.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon"] },
  { name: "Far Niente", slug: "far-niente", sub: "oakville", city: "Oakville", lat: 38.4386, lng: -122.4197, price: 4, desc: "Beautifully restored 1885 stone winery producing exceptional Cabernet Sauvignon and Chardonnay.", short: "Restored 1885 estate with exceptional wines.", web: "https://www.farniente.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Chardonnay"] },
  { name: "Oakville Grocery & Wine", slug: "oakville-grocery-wine", sub: "oakville", city: "Oakville", lat: 38.4311, lng: -122.4089, price: 1, desc: "Historic grocery and wine bar offering tastings from small local producers since 1881.", short: "Historic 1881 grocery with local wine tastings.", web: "https://www.oakvillegrocery.com", res: false, dog: true, picnic: true, wines: ["Cabernet Sauvignon", "Sauvignon Blanc", "Rosé"] },
  { name: "PlumpJack Winery", slug: "plumpjack", sub: "oakville", city: "Oakville", lat: 38.4350, lng: -122.4097, price: 4, desc: "Founded by Gavin Newsom, known for pioneering screwcap closures on premium Cabernet.", short: "Pioneer of screwcaps on premium Cabernet.", web: "https://www.plumpjack.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Chardonnay"] },
  // NAPA - Yountville (6)
  { name: "Domaine Chandon", slug: "domaine-chandon", sub: "yountville", city: "Yountville", lat: 38.4256, lng: -122.3522, price: 3, desc: "LVMH's California sparkling wine house with stunning grounds, restaurant, and elegant tastings.", short: "LVMH's elegant sparkling wine house.", web: "https://www.chandon.com", res: false, dog: false, picnic: true, wines: ["Brut", "Sparkling Rosé", "Blanc de Blancs", "Chardonnay"] },
  { name: "Cliff Lede Vineyards", slug: "cliff-lede", sub: "yountville", city: "Yountville", lat: 38.4189, lng: -122.3511, price: 4, desc: "Rock-and-roll themed estate with vineyard blocks named after classic rock songs.", short: "Rock-and-roll themed estate in Yountville.", web: "https://www.cliffledevineyards.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Sauvignon Blanc", "Red Blend"] },
  { name: "Jessup Cellars", slug: "jessup-cellars", sub: "yountville", city: "Yountville", lat: 38.4028, lng: -122.3608, price: 2, desc: "Downtown Yountville tasting room offering relaxed, art-filled wine experiences.", short: "Art-filled downtown tasting room.", web: "https://www.jessupcellars.com", res: false, dog: true, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Petite Sirah", "Red Blend"] },
  { name: "Girard Winery", slug: "girard-winery", sub: "yountville", city: "Yountville", lat: 38.4022, lng: -122.3597, price: 2, desc: "Small-production winery with a charming downtown Yountville tasting room.", short: "Small-production wines in downtown Yountville.", web: "https://www.girardwinery.com", res: false, dog: true, picnic: false, wines: ["Cabernet Sauvignon", "Petite Sirah", "Zinfandel"] },
  { name: "Ma(i)sonry Napa Valley", slug: "maisonry", sub: "yountville", city: "Yountville", lat: 38.4017, lng: -122.3614, price: 3, desc: "Multi-winery collective in a beautiful historic stone building with rotating selections.", short: "Multi-winery collective in historic setting.", web: "https://www.maisonry.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Pinot Noir", "Red Blend", "Chardonnay"] },
  { name: "Stewart Cellars", slug: "stewart-cellars", sub: "yountville", city: "Yountville", lat: 38.4014, lng: -122.3611, price: 3, desc: "Modern family winery offering elegant Cabernet and a stylish downtown tasting room.", short: "Elegant family Cabernets in stylish setting.", web: "https://www.stewartcellars.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Pinot Noir", "Chardonnay"] },
  // NAPA - Stags Leap District (5)
  { name: "Stag's Leap Wine Cellars", slug: "stags-leap-wine-cellars", sub: "stags-leap-district", city: "Napa", lat: 38.3989, lng: -122.3356, price: 4, desc: "The legendary estate whose 1973 Cabernet won the 1976 Judgment of Paris, reshaping the wine world.", short: "1976 Judgment of Paris winner.", web: "https://www.stagsleapwinecellars.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Chardonnay"] },
  { name: "Chimney Rock Winery", slug: "chimney-rock", sub: "stags-leap-district", city: "Napa", lat: 38.3956, lng: -122.3378, price: 3, desc: "Cape Dutch-inspired estate producing elegant Stags Leap Cabernet Sauvignon.", short: "Cape Dutch estate with elegant Cabernets.", web: "https://www.chimneyrock.com", res: true, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Sauvignon Blanc", "Rosé"] },
  { name: "Clos Du Val", slug: "clos-du-val", sub: "stags-leap-district", city: "Napa", lat: 38.3933, lng: -122.3367, price: 3, desc: "French-inspired winery producing refined, age-worthy wines from Stags Leap District.", short: "French-inspired wines from Stags Leap.", web: "https://www.closduval.com", res: true, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Merlot", "Chardonnay", "Pinot Noir"] },
  { name: "Baldacci Family Vineyards", slug: "baldacci-family", sub: "stags-leap-district", city: "Napa", lat: 38.3944, lng: -122.3389, price: 3, desc: "Family-owned boutique winery producing small lots of Stags Leap District Cabernet.", short: "Boutique family Cabernet from Stags Leap.", web: "https://www.baldaccivineyards.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Red Blend"] },
  { name: "Shafer Vineyards", slug: "shafer-vineyards", sub: "stags-leap-district", city: "Napa", lat: 38.3917, lng: -122.3344, price: 4, desc: "Iconic Stags Leap producer of Hillside Select, one of Napa's most sought-after Cabernets.", short: "Iconic producer of legendary Hillside Select.", web: "https://www.shafervineyards.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Chardonnay", "Syrah"] },
  // NAPA - Atlas Peak (3)
  { name: "Antinori Napa Valley", slug: "antinori-napa-valley", sub: "atlas-peak", city: "Napa", lat: 38.3867, lng: -122.2889, price: 4, desc: "Italian wine royalty's Napa Valley estate on Atlas Peak, producing elegant mountain wines.", short: "Italian wine royalty's Napa mountain estate.", web: "https://www.antinorinapa.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Red Blend", "Chardonnay"] },
  { name: "Pahlmeyer", slug: "pahlmeyer", sub: "atlas-peak", city: "Napa", lat: 38.3850, lng: -122.2900, price: 4, desc: "Cult Napa producer known for powerful, opulent red wines from Atlas Peak vineyards.", short: "Cult producer of powerful mountain reds.", web: "https://www.pahlmeyer.com", res: true, dog: false, picnic: false, wines: ["Red Blend", "Cabernet Sauvignon", "Chardonnay"] },
  { name: "William Hill Estate", slug: "william-hill", sub: "atlas-peak", city: "Napa", lat: 38.3833, lng: -122.2917, price: 2, desc: "Mountain estate offering panoramic views and well-crafted wines at accessible prices.", short: "Mountain estate with panoramic valley views.", web: "https://www.williamhillestate.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Chardonnay", "Merlot"] },
  // NAPA - Mount Veeder (3)
  { name: "Hess Collection", slug: "hess-collection", sub: "mount-veeder", city: "Napa", lat: 38.3753, lng: -122.4467, price: 3, desc: "Mount Veeder estate combining world-class art museum with acclaimed mountain wines.", short: "Art museum meets mountain winery.", web: "https://www.hesscollection.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Chardonnay", "Red Blend", "Malbec"] },
  { name: "Mayacamas Vineyards", slug: "mayacamas-vineyards", sub: "mount-veeder", city: "Napa", lat: 38.3750, lng: -122.4556, price: 4, desc: "Historic mountain estate producing age-worthy Cabernet Sauvignon since 1889.", short: "Historic mountain estate since 1889.", web: "https://www.mayacamas.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Chardonnay", "Merlot"] },
  { name: "Fontanella Family Winery", slug: "fontanella-family", sub: "mount-veeder", city: "Napa", lat: 38.3733, lng: -122.4478, price: 2, desc: "Small family winery on Mount Veeder offering intimate tastings with mountain views.", short: "Intimate family winery with mountain views.", web: "https://www.fontanellawinery.com", res: true, dog: true, picnic: true, wines: ["Cabernet Sauvignon", "Chardonnay", "Zinfandel"] },
  // NAPA - Carneros Napa (5)
  { name: "Domaine Carneros", slug: "domaine-carneros", sub: "carneros-napa", city: "Napa", lat: 38.2597, lng: -122.3639, price: 3, desc: "Taittinger's American chateau producing exquisite sparkling wines in a French-inspired setting.", short: "Taittinger's elegant American sparkling wine chateau.", web: "https://www.domainecarneros.com", res: false, dog: false, picnic: false, wines: ["Brut", "Blanc de Blancs", "Sparkling Rosé", "Pinot Noir"] },
  { name: "Artesa Vineyards", slug: "artesa-vineyards", sub: "carneros-napa", city: "Napa", lat: 38.2650, lng: -122.3650, price: 3, desc: "Modern hillside winery with stunning architecture and panoramic Carneros views.", short: "Modern architecture with panoramic Carneros views.", web: "https://www.artesawinery.com", res: false, dog: false, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Cabernet Sauvignon", "Sparkling Rosé"] },
  { name: "Bouchaine Vineyards", slug: "bouchaine-vineyards", sub: "carneros-napa", city: "Napa", lat: 38.2575, lng: -122.3417, price: 2, desc: "Carneros pioneer specializing in cool-climate Pinot Noir and Chardonnay.", short: "Carneros pioneer for Pinot Noir and Chardonnay.", web: "https://www.bouchaine.com", res: false, dog: true, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Pinot Grigio", "Rosé"] },
  { name: "Etude Wines", slug: "etude-wines", sub: "carneros-napa", city: "Napa", lat: 38.2611, lng: -122.3567, price: 3, desc: "Pinot Noir-focused winery from acclaimed winemaker Tony Soter.", short: "Tony Soter's acclaimed Pinot Noir house.", web: "https://www.etudewines.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Cabernet Sauvignon", "Rosé"] },
  { name: "Cuvaison Estate Wines", slug: "cuvaison", sub: "carneros-napa", city: "Napa", lat: 38.2589, lng: -122.3500, price: 2, desc: "Estate winery producing refined Pinot Noir and Chardonnay from Carneros vineyards.", short: "Refined Pinot Noir and Chardonnay estate.", web: "https://www.cuvaison.com", res: false, dog: true, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Sauvignon Blanc"] },
  // NAPA - Howell Mountain (4)
  { name: "CADE Estate Winery", slug: "cade-estate", sub: "howell-mountain", city: "Angwin", lat: 38.5644, lng: -122.4333, price: 4, desc: "LEED Gold-certified estate on Howell Mountain producing powerful, structured Cabernets.", short: "LEED Gold estate with powerful mountain Cabernets.", web: "https://www.cadewinery.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Sauvignon Blanc", "Red Blend"] },
  { name: "Howell Mountain Vineyards", slug: "howell-mountain-vineyards", sub: "howell-mountain", city: "Angwin", lat: 38.5600, lng: -122.4367, price: 3, desc: "Small mountain estate producing age-worthy wines from old-vine Zinfandel and Cabernet.", short: "Old-vine mountain Zinfandel and Cabernet.", web: "https://www.howellmountain.com", res: true, dog: false, picnic: false, wines: ["Zinfandel", "Cabernet Sauvignon", "Red Blend"] },
  { name: "Burgess Cellars", slug: "burgess-cellars", sub: "howell-mountain", city: "St. Helena", lat: 38.5589, lng: -122.4350, price: 3, desc: "Revived historic mountain winery producing structured, terroir-driven wines.", short: "Revived historic mountain winery.", web: "https://www.burgesscellars.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Syrah"] },
  { name: "Outpost Wines", slug: "outpost-wines", sub: "howell-mountain", city: "Angwin", lat: 38.5622, lng: -122.4356, price: 3, desc: "Small-production mountain winery at 2,000 feet producing intense, mineral-driven wines.", short: "High-elevation wines at 2,000 feet.", web: "https://www.outpostwines.com", res: true, dog: false, picnic: false, wines: ["Zinfandel", "Cabernet Sauvignon", "Petite Sirah"] },
  // SONOMA - Sonoma Valley (7)
  { name: "Buena Vista Winery", slug: "buena-vista", sub: "sonoma-valley", city: "Sonoma", lat: 38.2928, lng: -122.4564, price: 2, desc: "California's oldest premium winery, founded in 1857 by Count Agoston Haraszthy.", short: "California's oldest premium winery since 1857.", web: "https://www.buenavistawinery.com", res: false, dog: true, picnic: true, wines: ["Chardonnay", "Pinot Noir", "Cabernet Sauvignon", "Syrah"] },
  { name: "Gundlach Bundschu", slug: "gundlach-bundschu", sub: "sonoma-valley", city: "Sonoma", lat: 38.2794, lng: -122.4422, price: 2, desc: "Family-owned since 1858, one of Sonoma's most beloved wineries with a lively atmosphere.", short: "Beloved family winery since 1858.", web: "https://www.gunbun.com", res: false, dog: true, picnic: true, wines: ["Cabernet Sauvignon", "Merlot", "Zinfandel", "Chardonnay", "Rosé"] },
  { name: "Benziger Family Winery", slug: "benziger-family", sub: "sonoma-valley", city: "Glen Ellen", lat: 38.3639, lng: -122.5211, price: 2, desc: "Biodynamic winery offering estate tram tours through certified sustainable vineyards.", short: "Biodynamic estate with tram tours.", web: "https://www.benziger.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Merlot", "Sauvignon Blanc", "Chardonnay"] },
  { name: "Kunde Family Winery", slug: "kunde-family", sub: "sonoma-valley", city: "Kenwood", lat: 38.4083, lng: -122.5411, price: 2, desc: "Five-generation family estate with a mountain-top tasting room and 1,850 acres of vineyards.", short: "Five-generation estate with 1,850 acres.", web: "https://www.kunde.com", res: false, dog: true, picnic: true, wines: ["Cabernet Sauvignon", "Zinfandel", "Chardonnay", "Sauvignon Blanc", "Viognier"] },
  { name: "Kenwood Vineyards", slug: "kenwood-vineyards", sub: "sonoma-valley", city: "Kenwood", lat: 38.4150, lng: -122.5467, price: 2, desc: "Sonoma Valley stalwart known for Artist Series Cabernet and accessible wines.", short: "Known for iconic Artist Series Cabernet.", web: "https://www.kenwoodvineyards.com", res: false, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Sauvignon Blanc", "Pinot Noir", "Zinfandel"] },
  { name: "Imagery Estate Winery", slug: "imagery-estate", sub: "sonoma-valley", city: "Glen Ellen", lat: 38.3567, lng: -122.5189, price: 2, desc: "Unique winery featuring artist-labeled bottles and unusual varietals.", short: "Artist-labeled wines with unusual varietals.", web: "https://www.imagerywinery.com", res: false, dog: true, picnic: true, wines: ["Cabernet Sauvignon", "Malbec", "Pinot Noir", "White Blend"] },
  { name: "Ram's Gate Winery", slug: "rams-gate", sub: "sonoma-valley", city: "Sonoma", lat: 38.2539, lng: -122.4356, price: 3, desc: "Elegant Carneros-adjacent estate with farm-to-table food pairings and stunning views.", short: "Elegant estate with food pairings and views.", web: "https://www.ramsgatewinery.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay", "Syrah", "Cabernet Sauvignon"] },
  // SONOMA - Russian River Valley (8)
  { name: "Gary Farrell Vineyards", slug: "gary-farrell", sub: "russian-river-valley", city: "Healdsburg", lat: 38.5564, lng: -122.8206, price: 3, desc: "Hilltop winery with stunning views, renowned for single-vineyard Pinot Noir and Chardonnay.", short: "Hilltop Pinot Noir with stunning views.", web: "https://www.garyfarrellwinery.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay"] },
  { name: "Williams Selyem", slug: "williams-selyem", sub: "russian-river-valley", city: "Healdsburg", lat: 38.5475, lng: -122.8331, price: 4, desc: "Cult Pinot Noir producer known for single-vineyard wines with incredible waitlist demand.", short: "Cult Pinot Noir producer with legendary waitlist.", web: "https://www.williamsselyem.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay", "Zinfandel"] },
  { name: "Korbel Champagne Cellars", slug: "korbel", sub: "russian-river-valley", city: "Guerneville", lat: 38.5006, lng: -122.8997, price: 1, desc: "America's best-known sparkling wine producer with beautiful gardens and historic cellars.", short: "America's most popular sparkling wine house.", web: "https://www.korbel.com", res: false, dog: false, picnic: true, wines: ["Brut", "Sparkling Rosé", "Blanc de Blancs", "Chardonnay"] },
  { name: "Rochioli Vineyards", slug: "rochioli-vineyards", sub: "russian-river-valley", city: "Healdsburg", lat: 38.5308, lng: -122.8567, price: 4, desc: "Legendary Russian River estate producing some of California's finest Pinot Noir.", short: "Legendary Pinot Noir from Russian River.", web: "https://www.rochiolivineyards.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay", "Sauvignon Blanc"] },
  { name: "DeLoach Vineyards", slug: "deloach-vineyards", sub: "russian-river-valley", city: "Santa Rosa", lat: 38.4700, lng: -122.7881, price: 2, desc: "Biodynamic estate owned by Boisset family, producing elegant Russian River wines.", short: "Biodynamic estate with elegant wines.", web: "https://www.deloachvineyards.com", res: false, dog: true, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Zinfandel", "Rosé"] },
  { name: "Hartford Family Winery", slug: "hartford-family", sub: "russian-river-valley", city: "Forestville", lat: 38.4856, lng: -122.8519, price: 3, desc: "Small-lot winery specializing in old-vine Zinfandel and cool-climate Pinot Noir.", short: "Old-vine Zinfandel and cool-climate Pinot.", web: "https://www.hartfordwines.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay", "Zinfandel"] },
  { name: "Iron Horse Vineyards", slug: "iron-horse", sub: "russian-river-valley", city: "Sebastopol", lat: 38.4222, lng: -122.7819, price: 3, desc: "Estate sparkling wine producer served at White House State Dinners for five presidencies.", short: "White House favorite sparkling wine producer.", web: "https://www.ironhorsevineyards.com", res: true, dog: false, picnic: true, wines: ["Brut", "Sparkling Rosé", "Blanc de Blancs", "Pinot Noir"] },
  { name: "Lynmar Estate", slug: "lynmar-estate", sub: "russian-river-valley", city: "Sebastopol", lat: 38.4367, lng: -122.7897, price: 3, desc: "Elegant estate with beautiful gardens producing refined Pinot Noir and Chardonnay.", short: "Elegant gardens and refined Pinot Noir.", web: "https://www.lynmarestate.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay"] },
  // SONOMA - Dry Creek Valley (7)
  { name: "Dry Creek Vineyard", slug: "dry-creek-vineyard", sub: "dry-creek-valley", city: "Healdsburg", lat: 38.6464, lng: -122.8908, price: 2, desc: "Pioneering estate that helped establish Dry Creek Valley, known for Sauvignon Blanc and Zinfandel.", short: "Dry Creek Valley pioneer since 1972.", web: "https://www.drycreekvineyard.com", res: false, dog: true, picnic: true, wines: ["Sauvignon Blanc", "Zinfandel", "Cabernet Sauvignon", "Merlot", "Rosé"] },
  { name: "Quivira Vineyards", slug: "quivira-vineyards", sub: "dry-creek-valley", city: "Healdsburg", lat: 38.6467, lng: -122.9028, price: 2, desc: "Certified biodynamic estate with farm animals, gardens, and excellent Zinfandel.", short: "Biodynamic estate with farm and great Zinfandel.", web: "https://www.quivirawine.com", res: false, dog: true, picnic: true, wines: ["Zinfandel", "Sauvignon Blanc", "Syrah", "Rosé"] },
  { name: "Ridge Vineyards (Lytton Springs)", slug: "ridge-lytton-springs", sub: "dry-creek-valley", city: "Healdsburg", lat: 38.6200, lng: -122.8633, price: 3, desc: "Legendary winery's Sonoma outpost producing iconic Lytton Springs Zinfandel blend.", short: "Legendary producer of Lytton Springs Zinfandel.", web: "https://www.ridgewine.com", res: false, dog: false, picnic: true, wines: ["Zinfandel", "Red Blend", "Petite Sirah"] },
  { name: "Pedroncelli Winery", slug: "pedroncelli-winery", sub: "dry-creek-valley", city: "Geyserville", lat: 38.6611, lng: -122.8922, price: 1, desc: "Third-generation family winery offering excellent value wines since 1927.", short: "Family-owned value wines since 1927.", web: "https://www.pedroncelli.com", res: false, dog: true, picnic: true, wines: ["Zinfandel", "Cabernet Sauvignon", "Merlot", "Chardonnay", "Rosé"] },
  { name: "Ferrari-Carano Vineyards", slug: "ferrari-carano", sub: "dry-creek-valley", city: "Healdsburg", lat: 38.6378, lng: -122.8911, price: 3, desc: "Stunning Italian-inspired estate with formal gardens and acclaimed Fumé Blanc.", short: "Italian-inspired estate with famous Fumé Blanc.", web: "https://www.ferrari-carano.com", res: false, dog: false, picnic: false, wines: ["Sauvignon Blanc", "Chardonnay", "Cabernet Sauvignon", "Merlot", "Red Blend"] },
  { name: "Mauritson Wines", slug: "mauritson-wines", sub: "dry-creek-valley", city: "Healdsburg", lat: 38.6500, lng: -122.8889, price: 3, desc: "Six-generation farming family producing outstanding Dry Creek Zinfandel.", short: "Six-generation family Zinfandel producers.", web: "https://www.mauritsonwines.com", res: true, dog: false, picnic: false, wines: ["Zinfandel", "Cabernet Sauvignon", "Sauvignon Blanc"] },
  { name: "Amphora Winery", slug: "amphora-winery", sub: "dry-creek-valley", city: "Healdsburg", lat: 38.6489, lng: -122.8900, price: 2, desc: "Small artisan winery focusing on Rhône varietals and field blends from Dry Creek.", short: "Artisan Rhône varietals from Dry Creek.", web: "https://www.amphorawines.com", res: true, dog: true, picnic: true, wines: ["Syrah", "Zinfandel", "Viognier", "Red Blend"] },
  // SONOMA - Alexander Valley (6)
  { name: "Jordan Vineyard & Winery", slug: "jordan-winery", sub: "alexander-valley", city: "Healdsburg", lat: 38.6967, lng: -122.8744, price: 3, desc: "French-inspired chateau producing elegant Cabernet Sauvignon and Chardonnay since 1972.", short: "French-inspired chateau with elegant wines.", web: "https://www.jordanwinery.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Chardonnay"] },
  { name: "Francis Ford Coppola Winery", slug: "francis-ford-coppola", sub: "alexander-valley", city: "Geyserville", lat: 38.7133, lng: -122.8931, price: 2, desc: "Movie-themed wine park with pools, bocce, and wines inspired by Coppola's cinematic legacy.", short: "Movie-themed wine park and entertainment complex.", web: "https://www.francisfordcoppolawinery.com", res: false, dog: false, picnic: true, wines: ["Cabernet Sauvignon", "Zinfandel", "Pinot Noir", "Chardonnay", "Red Blend"] },
  { name: "Stonestreet Estate Vineyards", slug: "stonestreet-estate", sub: "alexander-valley", city: "Healdsburg", lat: 38.6678, lng: -122.8489, price: 3, desc: "Mountain estate with 5,000 acres producing powerful Alexander Valley wines.", short: "Massive mountain estate with powerful wines.", web: "https://www.stonestreet.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Chardonnay", "Sauvignon Blanc"] },
  { name: "Seghesio Family Vineyards", slug: "seghesio-family", sub: "alexander-valley", city: "Healdsburg", lat: 38.6136, lng: -122.8750, price: 2, desc: "Historic Italian-American family winery with some of Sonoma's oldest Zinfandel vines.", short: "Historic family with Sonoma's oldest Zinfandel.", web: "https://www.seghesio.com", res: false, dog: false, picnic: true, wines: ["Zinfandel", "Petite Sirah", "Red Blend", "Pinot Noir"] },
  { name: "Trentadue Winery", slug: "trentadue-winery", sub: "alexander-valley", city: "Geyserville", lat: 38.7100, lng: -122.8917, price: 1, desc: "Family winery known for approachable wines and the popular chocolate-port pairing.", short: "Family winery with beloved chocolate port.", web: "https://www.trentadue.com", res: false, dog: true, picnic: true, wines: ["Zinfandel", "Merlot", "Cabernet Sauvignon", "Petite Sirah", "Late Harvest"] },
  { name: "Silver Oak Alexander Valley", slug: "silver-oak-alexander", sub: "alexander-valley", city: "Healdsburg", lat: 38.6150, lng: -122.8667, price: 4, desc: "Alexander Valley counterpart to the Oakville estate, producing polished Cabernet Sauvignon.", short: "Polished Alexander Valley Cabernet Sauvignon.", web: "https://www.silveroak.com/alexander-valley", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon"] },
  // SONOMA - Carneros Sonoma (4)
  { name: "Gloria Ferrer Caves & Vineyards", slug: "gloria-ferrer", sub: "carneros-sonoma", city: "Sonoma", lat: 38.2414, lng: -122.4344, price: 2, desc: "Spanish-owned sparkling wine house with terrace overlooking Carneros vineyards.", short: "Spanish sparkling house with Carneros views.", web: "https://www.gloriaferrer.com", res: false, dog: false, picnic: false, wines: ["Brut", "Sparkling Rosé", "Blanc de Blancs", "Pinot Noir", "Chardonnay"] },
  { name: "Schug Carneros Estate", slug: "schug-carneros", sub: "carneros-sonoma", city: "Sonoma", lat: 38.2486, lng: -122.4233, price: 2, desc: "German-influenced estate producing refined Pinot Noir and Chardonnay.", short: "German-influenced Pinot Noir estate.", web: "https://www.schugwinery.com", res: false, dog: true, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Cabernet Sauvignon", "Sauvignon Blanc"] },
  { name: "Cline Family Cellars", slug: "cline-cellars", sub: "carneros-sonoma", city: "Sonoma", lat: 38.2492, lng: -122.4328, price: 1, desc: "Welcoming family estate with free tastings, California mission museum, and picnic grounds.", short: "Welcoming estate with free tastings.", web: "https://www.clinecellars.com", res: false, dog: true, picnic: true, wines: ["Zinfandel", "Syrah", "Viognier", "Pinot Noir", "Rosé"] },
  { name: "Nicholson Ranch", slug: "nicholson-ranch", sub: "carneros-sonoma", city: "Sonoma", lat: 38.2517, lng: -122.4267, price: 2, desc: "Family estate with underground caves producing Carneros Pinot Noir and Chardonnay.", short: "Underground caves with Carneros wines.", web: "https://www.nicholsonranch.com", res: false, dog: false, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Syrah"] },
  // SONOMA - Bennett Valley (3)
  { name: "Matanzas Creek Winery", slug: "matanzas-creek", sub: "bennett-valley", city: "Santa Rosa", lat: 38.4122, lng: -122.6150, price: 3, desc: "Famous for lavender fields and gardens alongside excellent Sauvignon Blanc and Merlot.", short: "Famous lavender fields and excellent wines.", web: "https://www.matanzascreek.com", res: false, dog: false, picnic: true, wines: ["Sauvignon Blanc", "Merlot", "Chardonnay"] },
  { name: "Arrowood Vineyards", slug: "arrowood-vineyards", sub: "bennett-valley", city: "Glen Ellen", lat: 38.3800, lng: -122.5783, price: 3, desc: "Richard Arrowood's acclaimed winery producing complex Sonoma Mountain wines.", short: "Acclaimed Sonoma Mountain wines.", web: "https://www.arrowoodvineyards.com", res: true, dog: false, picnic: false, wines: ["Cabernet Sauvignon", "Merlot", "Syrah", "Viognier"] },
  { name: "Landmark Vineyards", slug: "landmark-vineyards", sub: "bennett-valley", city: "Kenwood", lat: 38.4044, lng: -122.5897, price: 2, desc: "Picturesque estate producing acclaimed Chardonnay and Pinot Noir from Sonoma vineyards.", short: "Picturesque estate with acclaimed Chardonnay.", web: "https://www.landmarkwine.com", res: false, dog: true, picnic: true, wines: ["Chardonnay", "Pinot Noir"] },
  // SONOMA - Petaluma Gap (3)
  { name: "Keller Estate", slug: "keller-estate", sub: "petaluma-gap", city: "Petaluma", lat: 38.2247, lng: -122.5961, price: 3, desc: "Estate winery in the windswept Petaluma Gap producing distinctive Pinot Noir and Chardonnay.", short: "Distinctive Petaluma Gap Pinot Noir.", web: "https://www.kellerestate.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay", "Syrah", "Viognier"] },
  { name: "Ceja Vineyards", slug: "ceja-vineyards", sub: "petaluma-gap", city: "Sonoma", lat: 38.2306, lng: -122.5833, price: 2, desc: "First Mexican-American family to establish a winery in the Carneros-Petaluma Gap region.", short: "Pioneering Mexican-American family winery.", web: "https://www.cejavineyards.com", res: false, dog: true, picnic: true, wines: ["Pinot Noir", "Chardonnay", "Cabernet Sauvignon", "Syrah", "Rosé"] },
  { name: "Sangiacomo Family Wines", slug: "sangiacomo-family", sub: "petaluma-gap", city: "Sonoma", lat: 38.2283, lng: -122.5878, price: 3, desc: "Multi-generational grape-growing family now crafting their own wines from acclaimed vineyards.", short: "Legendary grape growers turned winemakers.", web: "https://www.sangiacomowines.com", res: true, dog: false, picnic: false, wines: ["Pinot Noir", "Chardonnay"] },
];

const wineDescriptions: Record<string, string> = {
  "Cabernet Sauvignon": "Full-bodied with dark fruit, firm tannins, and notes of cedar and blackcurrant.",
  "Pinot Noir": "Elegant and silky with red cherry, earthy undertones, and delicate complexity.",
  "Merlot": "Smooth and approachable with plum, black cherry, and soft tannins.",
  "Zinfandel": "Bold and fruit-forward with jammy berries, pepper, and warm spice.",
  "Syrah": "Rich and complex with dark fruit, smoky notes, and hints of black pepper.",
  "Cabernet Franc": "Medium-bodied with red fruit, herbal notes, and a velvety finish.",
  "Petite Sirah": "Dense and inky with blueberry, dark chocolate, and robust tannins.",
  "Malbec": "Deep purple with plum, blackberry, and smooth, velvety tannins.",
  "Red Blend": "Artful combination of varietals creating a complex, layered wine.",
  "Chardonnay": "Rich and buttery with tropical fruit, vanilla, and toasty oak notes.",
  "Sauvignon Blanc": "Crisp and refreshing with citrus, green apple, and herbaceous notes.",
  "Viognier": "Aromatic and lush with stone fruit, honeysuckle, and creamy texture.",
  "Riesling": "Floral and aromatic with green apple, lime, and mineral-driven finish.",
  "Pinot Grigio": "Light and crisp with pear, citrus, and delicate floral notes.",
  "White Blend": "Harmonious blend with layers of citrus, stone fruit, and refreshing acidity.",
  "Rosé": "Dry and refreshing with strawberry, watermelon, and citrus zest.",
  "Brut": "Fine bubbles with green apple, brioche, and elegant toasty finish.",
  "Blanc de Blancs": "All Chardonnay sparkling with creamy texture and citrus elegance.",
  "Sparkling Rosé": "Delicate bubbles with fresh raspberry, cream, and festive charm.",
  "Late Harvest": "Lusciously sweet with apricot, honey, and balanced acidity.",
};

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const hours = JSON.stringify({
  mon: "10:00-17:00", tue: "10:00-17:00", wed: "10:00-17:00",
  thu: "10:00-17:00", fri: "10:00-17:00", sat: "10:00-17:00", sun: "10:00-17:00",
});

const tastingTemplates = [
  { name: "Classic Tasting", desc: "Guided tasting of current release wines", price: [25, 35, 45, 55], dur: 45, inc: "4-5 current release wines" },
  { name: "Estate Tasting", desc: "Premium estate wines with cheese pairing", price: [40, 55, 65, 85], dur: 60, inc: "5-6 estate wines, artisan cheese" },
  { name: "Reserve Tasting", desc: "Exclusive tasting of limited production wines", price: [65, 85, 95, 125], dur: 75, inc: "4-5 reserve wines, charcuterie" },
  { name: "Library Tasting", desc: "Rare library vintages in an intimate setting", price: [85, 125, 150, 200], dur: 90, inc: "3-4 library wines, seated experience" },
  { name: "Cave Tour & Tasting", desc: "Behind-the-scenes cave tour with wine tasting", price: [45, 60, 75, 95], dur: 90, inc: "Cave tour, 4-5 wines" },
  { name: "Food & Wine Pairing", desc: "Curated food and wine pairing experience", price: [55, 75, 95, 125], dur: 75, inc: "5 wines paired with seasonal bites" },
];

function generateWinery(def: typeof wineryDefinitions[0]) {
  const priceIdx = def.price - 1;
  const wineList = def.wines.map((wt) => {
    const basePrices: Record<number, [number, number]> = {
      1: [18, 45], 2: [25, 65], 3: [35, 95], 4: [55, 200],
    };
    const [min, max] = basePrices[def.price];
    return {
      name: `${def.name.split(" ")[0]} ${wt}`,
      wineType: wt,
      vintage: randInt(2019, 2023),
      price: randInt(min, max),
      description: wineDescriptions[wt] || "A carefully crafted wine showcasing the best of the region.",
      rating: rand(3.6, 4.8),
      ratingSource: "vivino",
      ratingCount: randInt(50, 2000),
    };
  });

  const numTastings = randInt(1, 3);
  const tastings = tastingTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, numTastings)
    .map((t) => ({
      name: t.name,
      description: t.desc,
      price: t.price[priceIdx],
      durationMinutes: t.dur,
      includes: t.inc,
      reservationRequired: def.res,
      minGroupSize: 1,
      maxGroupSize: randInt(6, 12),
    }));

  const wineryRating = rand(3.8, 4.8);
  return {
    name: def.name,
    slug: def.slug,
    subRegionSlug: def.sub,
    curated: false as const,
    curatedAt: null as string | null,
    description: def.desc,
    shortDescription: def.short,
    address: `${randInt(100, 9999)} ${["Highway 29", "Silverado Trail", "St. Helena Hwy", "Sonoma Hwy", "Dry Creek Rd", "Westside Rd", "Wine Rd", "Arnold Dr"][randInt(0, 7)]}`,
    city: def.city,
    zip: ["94515", "94574", "94573", "94558", "94559", "95448", "95476", "95472", "95425", "95441"][randInt(0, 9)],
    lat: def.lat,
    lng: def.lng,
    phone: `(707) ${randInt(200, 999)}-${randInt(1000, 9999)}`,
    websiteUrl: def.web,
    hoursJson: hours,
    reservationRequired: def.res,
    dogFriendly: def.dog,
    picnicFriendly: def.picnic,
    priceLevel: def.price,
    wines: wineList,
    tastings,
    ratings: [
      { provider: "vivino", score: wineryRating, maxScore: 5, reviewCount: randInt(200, 5000) },
      { provider: "cellartracker", score: rand(82, 97), maxScore: 100, reviewCount: randInt(50, 1500) },
    ],
  };
}

const generatedWineries = wineryDefinitions
  .filter((def) => !curatedSlugs.has(def.slug))
  .map(generateWinery);

const allWineries = [...curatedWineries, ...generatedWineries];
writeFileSync(
  "./src/db/seed/data/wineries.json",
  JSON.stringify(allWineries, null, 2)
);
console.log(`Generated ${generatedWineries.length} wineries + ${curatedWineries.length} curated = ${allWineries.length} total`);
