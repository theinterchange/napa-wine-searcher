# Accommodation Amenity Comparison: Production | old-v3 | new-v3 | Manual — With Recommendations
Generated: 2026-04-13

**Sort order within each table:** 🔴 Prod vs new-v3 disagreements first, then 🟡 any diff, then ✅ all agree

**Columns:**
- **Prod** = current production value (and confidence on kid if available)
- **old-v3** = previous v3 audit (buggy pre-scope-fix script)
- **new-v3** = today's audit with fixed scope-aware classifier
- **Manual** = hand-curated correction if any (always wins)
- **Rec** = recommendation for 🔴 disagreements only
- **Source Quote** = new-v3's property-wide quote with `[scope]` tag and URL

## Overview

| Metric | Count |
|---|---|
| Accommodations in production | 127 |
| New v3 (fixed script) | 124 |
| Old v3 (buggy script) | 125 |
| Manual corrections | 24 |

**🔴 Prod vs new-v3 disagreements:** 16 total (14 ACCEPT_V3, 2 KEEP_PROD)

**🟢 Category A new adds (prod NULL + new-v3 high-conf):** 55


---

## Dog Friendly — All 127 Accommodations

| # | Accommodation | Prod | old-v3 | new-v3 | Manual | Rec | Source Quote |
|---|---|---|---|---|---|---|---|
| 1 | 🔴 Calderwood Inn | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] Only one dog under 50 lbs. permitted in the inn at any one time. — calderwoodinn.com/policies |
| 2 | 🔴 Candlelight Inn Napa Valley | YES | NO(high) | NO(high) |  | 🟢 v3 | [property-wide] We are not able to accommodate pets. — candlelightinn.com/policies |
| 3 | 🔴 Dawn Ranch | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] Dawn Ranch is a wonderful place to enjoy some quality outdoor time with your canine companion. — dawnranch.com/faq |
| 4 | 🔴 Johnson's Beach - Cabins and Campgroun | NO | YES(high) | YES(high) |  | 🔵 prod | [property-wide] Unfortunately, pets are not allowed on the beach at any time. — johnsonsbeach.com/faq |
| 5 | 🔴 Roman Spa Hot Springs Resort | YES | NO(high) | NO(high) |  | 🟢 v3 | [property-wide] Roman Spa Hot Springs Resort is not a pet-friendly property. — romanspahotsprings.com/faq |
| 6 | 🔴 Silverado Resort | YES | NO(high) | NO(high) |  | 🟢 v3 | [property-wide] Silverado does not allow pets in our guest areas. — silveradoresort.com/faq |
| 7 | 🔴 Surrey Resort | YES | NO(high) | NO(high) |  | 🟢 v3 | [property-wide] Unfortunately, we are not a pet friendly property due to safety reasons. Please leave your furry friends at home. — surreyrr.com/faq |
| 8 | 🔴 The Lodge at Bodega Bay | YES | NO(high) | NO(high) |  | 🟢 v3 | [property-wide] we welcome service animals in compliance with federal and state laws, however, pets are not permitted in the hotel. — lodgeatbodegabay.com/info-policies |
| 9 | 🆕 Calistoga Wayside Inn | — | — | — |  |  |  |
| 10 | 🆕 Resort at Sonoma County | — | — | — |  |  |  |
| 11 | 🆕 Vista Collina Resort | — | — | — |  |  |  |
| 12 |  Alila Napa Valley | NO | NO(low) | NO(low) | NO (Service animals only) |  | (no quote) No evidence found |
| 13 |  Andaz Napa, by Hyatt | YES | NO(low) | NO(low) | YES (Dogs welcome, $150 non-refunda) |  | (no quote) No evidence found |
| 14 |  Archer Hotel Napa | YES | NO(low) | YES(high) | YES (Dogs up to 50 lbs welcome, $15) |  | [property-wide] Guests may bring one pet dog or emotional support dog (up to 50 lbs.) per room upon request. — archerhotel.com/napa/pups-welcome |
| 15 |  Auberge du Soleil | NO | NO(low) | NO(low) | NO (Service dogs only) |  | (no quote) No evidence found |
| 16 |  boon hotel + spa | YES | NO(low) | NO(low) | YES (Select rooms only, must pre-ar) |  | (no quote) No evidence found |
| 17 |  Calistoga Inn Restaurant & Brewery / C | NO | NO(low) | NO(low) | NO (Dogs welcome on restaurant pat) |  |  |
| 18 |  Fairmont Sonoma Mission Inn & Spa | YES | NO(low) | NO(low) | YES (Pet fee $150/pet/stay, max 2 a) |  |  |
| 19 |  Four Seasons Resort and Residences Nap | YES | NO(low) | NO(low) | YES (Up to 2 dogs totaling 70 lbs o) |  | (no quote) No evidence found |
| 20 |  h2hotel | YES | NO(low) | YES(high) | YES (Dogs 50 lbs or less, $99/stay.) |  | [property-wide] YOUR DOG Must be 50lbs or less. Must be fully trained. Must be kept on a leash when in the hotel or on hotel property. — h2hotel.com/hotel/dog-policy |
| 21 |  Harmon Guest House | YES | NO(low) | YES(high) | YES (Dogs 50 lbs or less, $99/stay.) |  | [property-wide] Must be kept on a leash when in the hotel or on hotel property unless it is in a guest room. — harmonguesthouse.com/information/dog-policy |
| 22 |  Hotel Healdsburg | YES | NO(low) | YES(high) | YES (Dogs 50 lbs or less, $99/stay.) |  | [property-wide] Hotel Healdsburg is a pet-friendly place to be. — hotelhealdsburg.com/information/dog-policy |
| 23 |  Hotel Napa Valley, an Ascend Collectio | YES | NO(low) | NO(low) | YES (Pet-friendly, contact hotel fo) |  | (no quote) No evidence found |
| 24 |  Inn on the Russian River | YES | NO(low) | NO(low) | YES ($50/night pet fee, 1 dog per r) |  |  |
| 25 |  Ledson Hotel | NO | NO(low) | NO(high) | NO |  | [property-wide] sorry no pets are allowed. — ledsonhotel.com/contact-and-directions |
| 26 |  Mine + Farm / The Inn at Guerneville,  | YES | NO(low) | NO(low) | YES (Dogs in Carriage House rooms o) |  |  |
| 27 |  Montage Healdsburg | YES | NO(low) | NO(low) | YES (Dogs and cats under 45 lbs, $1) |  | (no quote) No evidence found |
| 28 |  Napa River Inn | YES | NO(low) | NO(low) | YES ($50/night, max 2 pets. VIP Pet) |  |  |
| 29 |  SingleThread Farm - Restaurant - Inn | NO | NO(low) | NO(low) | NO (Service animals only — emotion) |  | (no quote) No quotes regarding dogs or pets found on the website. |
| 30 |  Solage, Auberge Collection | YES | NO(low) | NO(low) | YES ($150 per room, max 2 dogs, no ) |  | (no quote) No evidence found |
| 31 |  Sonoma Bungalows | NO | NO(low) | NO(low) | NO (No pets allowed) |  | (no quote) No evidence found |
| 32 |  Southbridge Napa Valley | NO | NO(low) | NO(low) | NO (Pets not allowed) |  |  |
| 33 |  Stanly Ranch, Auberge Collection | YES | NO(low) | NO(low) | YES ($250 plus tax per canine, max ) |  | (no quote) No evidence found |
| 34 |  The Ranch At Lake Sonoma | YES | NO(low) | NO(low) | YES (Pets allowed on leash at all t) |  |  |
| 35 |  The Westin Verasa Napa | YES | NO(low) | NO(low) | YES (Pets welcome, $40/night non-re) |  | (no quote) No relevant information found regarding dogs or pets. |
| 36 |  27 North | — | YES(high) | YES(high) |  |  | [property-wide] 27 North allows well-behaved pets — dogs and cats — at a nonrefundable $250 USD fee per pet per stay. — hotel27north.com/faqs.htm |
| 37 |  Appellation Healdsburg | YES | YES(high) | YES(high) |  |  | [property-wide] We are a dog friendly hotel offering a limited number of dog friendly rooms. — appellationhotels.com/pet-policy |
| 38 |  AutoCamp Sonoma | YES | YES(high) | YES(high) |  |  | [property-wide] AutoCamp welcomes all well-behaved dogs with their owners for an additional fee of $75.00 per stay for up to 2 dogs. — autocamp.com/faq |
| 39 |  Bardessono Hotel and Spa | YES | YES(high) | YES(high) |  |  | [property-wide] We are a pet dog friendly hotel and offer goodies especially for your pet. — bardessono.com/faq |
| 40 |  Bella Luna Inn | NO | NO(high) | NO(high) |  |  | [property-wide] No pets allowed except for service or emotional support animals. — bellalunasonoma.com/policies |
| 41 |  Boho Manor | NO | NO(high) | NO(high) |  |  | [property-wide] Boho Manor welcome service animals and dogs to join you in your stay. — bohomanor.com |
| 42 |  Brannan Cottage Inn | YES | YES(high) | YES(high) |  |  | [property-wide] We are pet-friendly! Pets are allowed when booking our pet-friendly rooms: Cottage King (Rooms 1 and 3) and Fireplace Loft King (R — brannanhotels.com/faq |
| 43 |  Calistoga Wine Way Inn | — | YES(high) | YES(high) |  |  | [property-wide] One dog under 50lbs is welcome only in the designated pet friendly rooms for a charge of $49 per night. — lodginginnapavalley.com/policies |
| 44 |  Camellia Inn | — | YES(high) | YES(high) |  |  | [property-wide] Only one dog under 50 lbs. permitted in the inn at any one time. — camelliainn.com/policies |
| 45 |  Carneros Resort and Spa | YES | YES(high) | YES(high) |  |  | [property-wide] Many of our accommodations are also pet-friendly, so every member of the family can join in. — carnerosresort.com/family |
| 46 |  Castello Victorian Inn | — | NO(low) | NO(low) |  |  |  |
| 47 |  Chateau de Vie | — | NO(low) | NO(low) |  |  |  |
| 48 |  Cottage Grove Inn | YES | YES(high) | YES(high) |  |  | [property-wide] Select cottages are pet-friendly for a small additional fee of $50/pet/night. — cottagegrove.com/faqs-1 |
| 49 |  Cottage Inn & Spa | — | NO(high) | NO(high) |  |  | [property-wide] Regretfully our property is not equipped to welcome your pets, but service animals are welcome! — cottageinnsonoma.com/faq |
| 50 |  Cottages On River Road | YES | YES(high) | YES(high) |  |  | [property-wide] Dog friendly. — cottagesonriverroad.com |
| 51 |  Craftsman Inn | — | YES(high) | YES(high) |  |  | [property-wide] One dog under 50lbs is welcome only in the designated pet friendly rooms for a charge of $49 per night. — lodginginnapavalley.com/policies |
| 52 |  Creekside Inn & Resort | — | NO(low) | NO(low) |  |  |  |
| 53 |  Dr. Wilkinson's Backyard Resort & Mine | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 54 |  Duchamp Healdsburg | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 55 |  El Bonita Motel | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 56 |  El Dorado Hotel | — | YES(high) | YES(high) |  |  | [property-wide] We are a pet-friendly hotel. Pets are welcome with a $75 fee. — eldoradosonoma.com/faq |
| 57 |  Fairfield by Marriott Inn & Suites San | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 58 |  Farmhouse Inn | — | NO(high) | NO(high) |  |  | [property-wide] we are not a pet-friendly property. — farmhouseinn.com/pages/frequently-asked-questions |
| 59 |  Gaige House | YES | YES(high) | YES(high) |  |  | [property-wide] We have a select few dog-friendly guestrooms and a special advance reservation is required as well as an additional $100 per-night — thegaigehouse.com/pol |
| 60 |  Geyserville Inn | NO | NO(high) | NO(high) |  |  | [property-wide] We are a pet-free property. With the exception of certified service animals, we do not allow pets. — geyservilleinn.com/faq |
| 61 |  Golden Haven Spa LLC | — | NO(low) | NO(low) |  |  |  |
| 62 |  Grand Reserve - Meritage Resort | YES | YES(high) | YES(high) |  |  | [property-wide] Yes, we are delighted to welcome dogs with their owners. — meritageresort.com/faq |
| 63 |  Grape Leaf Inn | YES | YES(high) | YES(high) |  |  | [property-wide] Only one dog under 50 lbs. permitted in the inn at any one time. — grapeleafinn.com/policies |
| 64 |  Guerneville Lodge | NO | NO(high) | NO(high) |  |  | [property-wide] Pets are not allowed on the Guerneville property. — guernevillelodge.com |
| 65 |  Hampton Inn Petaluma | YES | YES(high) | YES(high) |  |  | [property-wide] we’re welcoming four-legged guests at over 5,000 hotels across the U.S. and Canada — hilton.com/pets |
| 66 |  Harvest Inn | — | YES(high) | YES(high) |  |  | [property-wide] We are a dog friendly property and allow a maximum of two dogs per room. — harvestinn.com/faq |
| 67 |  Healdsburg Inn, A Four Sisters Inn | YES | YES(high) | YES(high) |  |  | [property-wide] We have one dog-friendly guestroom and a special advance reservation is required as well as an additional non-refundable fee. — healdsburginn.com/policies |
| 68 |  Highlands Resort | YES | YES(high) | YES(high) |  |  | [property-wide] Dogs: Are allowed in three of our individual cabins. — highlandsresort.com/policies |
| 69 |  Hotel Petaluma | — | NO(low) | NO(low) |  |  | [property-wide] you will find our amenities details, check-in and check-out time, pets and extra person policies, and our hotel’s cancellation pol — hotelpetaluma.com/faq |
| 70 |  Hotel Petaluma, Tapestry Collection by | YES | YES(high) | YES(high) |  |  | [property-wide] Furry friends are family, too. We get it. Which is why we’re welcoming four-legged guests at over 5,000 hotels across the U.S. and — hilton.com/pets |
| 71 |  Hotel Trio Healdsburg | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 72 |  Hotel Villagio at The Estate Yountvill | YES | YES(high) | YES(high) |  |  | [property-wide] We allow up to two pets per room, each weighing 50 pounds or less. — theestateyountville.com/faq |
| 73 |  Hotel Yountville | YES | YES(high) | YES(high) |  |  | [property-wide] Yes, we allow pets. There is a non-refundable pet fee of $150 per animal, unless they are a registered service animal. — hotelyountville.com/faq |
| 74 |  Indian Springs Calistoga | — | NO(high) | NO(high) |  |  | [property-wide] we welcome service animals in compliance with federal and state laws, however pets are not permitted — indianspringscalistoga.com/policies |
| 75 |  Inn at Salvestrin Winery | — | YES(high) | YES(high) |  |  | [experience-specific] *Our estate experience is both kid and pet friendly. — salvestrinwinery.com/visit |
| 76 |  Inn At Sonoma, A Four Sisters Inn | YES | YES(high) | YES(high) |  |  | [property-wide] We have one dog-friendly guestroom and a special advance reservation is required as well as an additional non-refundable fee. — innatsonoma.com/policies |
| 77 |  Inn St. Helena | — | NO(high) | NO(high) |  |  | [property-wide] No, pets are not allowed with the exception of service animals for the visually impaired. — innsthelena.com/pages/frequently-asked-questions |
| 78 |  Kenwood Inn & Spa | YES | YES(high) | YES(high) |  |  | [property-wide] We have one dog-friendly guestroom and a special advance reservation is required as well as an additional non-refundable fee. — kenwoodinn.com/policies |
| 79 |  Lavender, A Four Sisters Inn | YES | YES(high) | YES(high) |  |  | [property-wide] We have one dog-friendly guestroom and a special advance reservation is required as well as an additional non-refundable fee. — lavendernapa.com/policies |
| 80 |  Le Petit Pali St. Helena | YES | YES(high) | YES(high) |  |  | [property-wide] we are pet-friendly — lepetitpali.com/locations/at-ocean-ave-carmel-by-the… |
| 81 |  MacArthur Place Hotel & Spa | — | YES(high) | YES(high) |  |  | [property-wide] Our pet fee is $150, with an extra $50 per dog (two dogs maximum). — macarthurplace.com/faq |
| 82 |  Maison Fleurie, A Four Sisters Inn | YES | YES(high) | YES(high) |  |  | [property-wide] We have one dog-friendly guestroom and a special advance reservation is required as well as an additional non-refundable fee. — maisonfleurienapa.com/poli |
| 83 |  Meadowlark Country House & Resort | YES | YES(high) | YES(high) |  |  | [property-wide] Meadowlark is also dog-friendly. — meadowlarkinn.com |
| 84 |  Meadowood Napa Valley | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 85 |  Metro Hotel & Cafe | — | NO(low) | NO(low) |  |  |  |
| 86 |  Milliken Creek Inn | NO | NO(high) | NO(high) |  |  | [property-wide] Do you allow dogs? — millikencreekinn.com/faq |
| 87 |  Mount View Hotel & Spa | NO | NO(high) | NO(high) |  |  | [property-wide] we do not allow pets on the property or in any guestroom. — mountviewhotel.com/policies |
| 88 |  Napa Valley Lodge | — | NO(low) | YES(high) |  |  | [property-wide] Pets — napavalleylodge.com/faqs |
| 89 |  North Block Hotel | — | YES(high) | YES(high) |  |  | [property-wide] We warmly welcome dogs - a $150 fee per pet will apply per stay. — northblockhotel.com/faq |
| 90 |  Olea Hotel | YES | YES(high) | YES(high) |  |  | [property-wide] Olea Hotel is pet-friendly with the Hillside Queen Rooms, Lower King Room, Upper View King Room, and Lower Garden Cottage having t — oleahotel.com/policie |
| 91 |  R INN NAPA | NO | NO(high) | NO(high) |  |  | [property-wide] There are no pets allowed on property. Service animals are permitted with proper documentation. — rinnnapa.com/faq |
| 92 |  R3 Hotel | — | NO(low) | NO(low) |  |  |  |
| 93 |  Rancho Caymus Inn | NO | NO(high) | NO(high) |  |  | [property-wide] Rancho Caymus Inn is a pet-free boutique property (with the exception of Service Animals) — ranchocaymusinn.com/faq |
| 94 |  River Bend Resort | — | YES(high) | YES(high) |  |  | [property-wide] He was also super friendly with our pup, Thor before taking off to the front. — riverbendresort.net |
| 95 |  River Terrace Inn | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 96 |  SENZA Hotel | YES | YES(high) | YES(high) |  |  | [property-wide] Yes! Senza welcomes one furry friend per guest room. — senzahotel.com/faq |
| 97 |  Sonoma Creek Inn | YES | YES(high) | YES(high) |  |  | [property-wide] Sonoma Creek Inn has a few dog-friendly guestrooms. — sonomacreekinn.com/policies |
| 98 |  Sonoma Hotel | NO | NO(high) | NO(high) |  |  | [property-wide] We have a no pets policy, with the exception of qualified service animals. — sonomahotel.com/policies |
| 99 |  Sonoma Valley Inn, Tapestry Collection | YES | YES(high) | YES(high) |  |  | [property-wide] Furry friends are family, too. We get it. Which is why we’re welcoming four-legged guests at over 5,000 hotels across the U.S. and — hilton.com/pets |
| 100 |  Sttupa Estate Napa Valley | — | NO(high) | NO(high) |  |  | [property-wide] Sttupa Estate Napa Valley does not allow pets, with an exception for registered service dogs which must remain on a leash in commo — sttupaestate.com/faq |
| 101 |  THE BERGSON | — | NO(high) | NO(high) |  |  | [property-wide] Unfortunately, The Bergson is not a pet-friendly hotel. — thebergson.com/faqs |
| 102 |  The Bungalows at Calistoga | — | YES(high) | YES(high) |  |  | [property-wide] Calistoga is paws-itively packed with dog-friendly fun! — thebungalowsatcalistoga.com/dog-friendly |
| 103 |  The Cottages of Napa Valley | — | NO(high) | NO(high) |  |  | [property-wide] we are unable to accommodate pets in our cottages. — napacottages.com/policies |
| 104 |  The Estate Yountville | YES | YES(high) | YES(high) |  |  | [property-wide] We love welcoming our four-legged guests to Estate Yountville! — theestateyountville.com/faq |
| 105 |  The Francis House | — | NO(low) | NO(low) |  |  |  |
| 106 |  The George | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 107 |  The Inn on Pine | NO | NO(high) | NO(high) |  |  | [property-wide] No pets allowed (except service dogs). — theinnonpine.com/policies-information |
| 108 |  The Lodge at Sonoma Resort, Autograph  | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding dogs or pets. |
| 109 |  The Madrona | — | YES(high) | YES(high) |  |  | [property-wide] The Madrona is a dog friendly property. Furry friends are welcome to join in on stays with us with a pet fee of $150/stay. — themadronahotel.com/faq |
| 110 |  The Meritage Resort and Spa | — | YES(high) | YES(high) |  |  | [property-wide] Yes, we are delighted to welcome dogs with their owners. — meritageresort.com/faq |
| 111 |  The Setting Inn Napa Valley | — | NO(low) | NO(low) |  |  |  |
| 112 |  The Spa at The Lodge at Sonoma | YES | YES(high) | YES(high) |  |  | [property-wide] The Lodge at Sonoma is delighted to welcome you and every member of your family, furry friends included! — thelodgeatsonoma.com/pet-friendly |
| 113 |  The Stavrand Russian River Valley | — | YES(high) | YES(high) |  |  | [property-wide] Absolutely, in several rooms. Please call ahead to request a dog-friendly room and we'll get you squared away. — thestavrand.com/faq |
| 114 |  The Swiss Hotel | — | NO(low) | NO(low) |  |  |  |
| 115 |  The Woods Cottages & Cabins @ Russian  | YES | YES(high) | YES(high) |  |  | [property-wide] The three dog friendly rooms are Cabin 14, 15 and 16 – only. — russianriverhotel.com/the-woods-guerneville-cottages… |
| 116 |  Timber Cove Resort | YES | YES(high) | YES(high) |  |  | [property-wide] Yes. We’re a pet-friendly resort. — timbercoveresort.com/faq |
| 117 |  Two Thirty-Five Luxury Suites | NO | NO(high) | NO(high) |  |  | [property-wide] we're sorry, but no pets are allowed in the suites at any time. — twothirty-five.com/faq |
| 118 |  UpValley Inn & Hot Springs Napa Valley | NO | NO(high) | NO(high) |  |  | [property-wide] Pets are not permitted at UpValley Inn & Hot Springs. — upvalleyinn.com/faqs |
| 119 |  Vignoble | — | NO(low) | NO(low) |  |  |  |
| 120 |  Vinarosa Resort & Spa | — | YES(high) | YES(high) |  |  | [property-wide] Dogs are permitted and a one-time, non-refundable pet fee of $150.00 per stay. — vinarosaresort.com/resort-policies/ |
| 121 |  Vineyard Country Inn | — | NO(low) | NO(low) |  |  |  |
| 122 |  Vino Bello Resort | YES | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 123 |  Vintage House at The Estate Yountville | YES | YES(high) | YES(high) |  |  | [property-wide] We love welcoming our four-legged guests to Estate Yountville! — theestateyountville.com/faq |
| 124 |  West Sonoma Inn & Spa | — | NO(low) | NO(low) |  |  |  |
| 125 |  White House Napa | YES | YES(high) | YES(high) |  |  | [property-wide] Yes, we welcome dogs for an additional fee of $150 per stay for one dog, or $200 per stay for two dogs. — whitehousenapa.com/faqs |
| 126 |  Wildhaven Sonoma Glamping | — | YES(high) | YES(high) |  |  | [property-wide] Furry friends need fresh air too! Up to 2 well-behaved dogs are welcome in our tents. — wildhavensonoma.com/faq |
| 127 |  Wydown Hotel | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |

---

## Kid Friendly — All 127 Accommodations

| # | Accommodation | Prod | old-v3 | new-v3 | Manual | Rec | Source Quote |
|---|---|---|---|---|---|---|---|
| 1 | ⚠️ Ledson Hotel | NO | NO(low) | YES(high) | NO (No children under 12) |  | [property-wide] Children under 12 are not allowed. — ledsonhotel.com/contact-and-directions |
| 2 | ⚠️ SingleThread Farm - Restaurant - Inn | NO | NO(low) | YES(high) | NO |  | [property-wide] In consideration of our other guests, we do not admit children under the age of 12. — singlethreadfarms.com/bookings |
| 3 | 🔴 Bella Luna Inn | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] we require the adult to agree, in writing, not to leave any minor 12 years of age or younger unattended — bellalunasonoma.com/policies |
| 4 | 🔴 Dawn Ranch | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] Dawn Ranch welcomes children of all ages. — dawnranch.com/faq |
| 5 | 🔴 El Dorado Hotel | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] Yes, children under 18 stay free if accommodated in existing bedding. — eldoradosonoma.com/faq |
| 6 | 🔴 Healdsburg Inn, A Four Sisters Inn | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] Children five years and younger stay for free. — healdsburginn.com/policies |
| 7 | 🔴 North Block Hotel | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] Children under 18 stay free if accommodated in existing bedding. — northblockhotel.com/faq |
| 8 | 🔴 Olea Hotel | NO | YES(high) | YES(high) |  | 🟢 v3 | [property-wide] For this reason, we welcome children 13 years and older at Olea Hotel. — oleahotel.com/policies |
| 9 | 🔴 The Inn on Pine | NO | NO(low) | YES(high) |  | 🟢 v3 | [property-wide] Our two room suite is ideal for families and friends. — theinnonpine.com/faq |
| 10 | 🔴 The Westin Verasa Napa | NO | NO(low) | YES(high) |  | 🔵 prod | [property-wide] Family-Friendly Beach Resorts in Florida — marriott.com |
| 11 | 🟡 Grand Reserve - Meritage Resort | NO | YES(high) | NO(high) |  |  | [property-wide] Guests must be 21 and older or accompanied by an adult. — meritageresort.com/faq |
| 12 | 🟡 Indian Springs Calistoga | — | NO(high) | YES(high) |  |  | [property-wide] guests under the age of 14 must be accompanied by an adult — indianspringscalistoga.com/policies |
| 13 | 🟡 The Meritage Resort and Spa | — | YES(high) | NO(high) |  |  | [property-wide] Guests must be 21 and older or accompanied by an adult. — meritageresort.com/faq |
| 14 | 🟡 The Woods Cottages & Cabins @ Russian  | — | YES(high) | NO(high) |  |  | [property-wide] The Woods is an adult-hotel and not recommended for minors. — russianriverhotel.com/the-woods-guerneville-cottages… |
| 15 | 🟡 Timber Cove Resort | NO | YES(high) | NO(low) |  |  | [property-wide] Guests under 16 are not permitted in the fitness center. — timbercoveresort.com/faq |
| 16 | 🆕 Calistoga Wayside Inn | — | — | — |  |  |  |
| 17 | 🆕 Resort at Sonoma County | — | — | — |  |  |  |
| 18 | 🆕 Vista Collina Resort | — | — | — |  |  |  |
| 19 |  Alila Napa Valley | YES | NO(low) | NO(low) | YES (Minors allowed with signed sup) |  | (no quote) No evidence found |
| 20 |  Auberge du Soleil | NO | NO(low) | NO(low) | NO |  | (no quote) No evidence found |
| 21 |  boon hotel + spa | NO | NO(low) | NO(low) | NO |  | (no quote) No evidence found |
| 22 |  Mine + Farm / The Inn at Guerneville,  | NO | NO(low) | NO(low) | NO |  |  |
| 23 |  27 North | — | YES(high) | YES(high) |  |  | [property-wide] Children are welcome under the supervision of an adult in your party. — hotel27north.com/faqs.htm |
| 24 |  Andaz Napa, by Hyatt | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 25 |  Appellation Healdsburg | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 26 |  Archer Hotel Napa | — | NO(low) | NO(low) |  |  | (no quote) No relevant information found regarding children or family policies. |
| 27 |  AutoCamp Sonoma | — | YES(high) | YES(high) |  |  | [property-wide] AutoCamp is the perfect place to experience the outdoors with your family. All ages are welcome. — autocamp.com/faq |
| 28 |  Bardessono Hotel and Spa | — | NO(low) | NO(low) |  |  | (no quote) No quotes regarding children or family policies were found on the website. |
| 29 |  Boho Manor | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 30 |  Brannan Cottage Inn | — | NO(low) | NO(low) |  |  | (no quote) No information found regarding children or family policies. |
| 31 |  Calderwood Inn | YES | YES(high) | YES(high) |  |  | [property-wide] While we welcome all families, we kindly request that guests traveling with young children carefully consider our accommodations,  — calderwoodinn.com/pol |
| 32 |  Calistoga Inn Restaurant & Brewery / C | — | NO(low) | NO(low) |  |  |  |
| 33 |  Calistoga Wine Way Inn | — | YES(high) | YES(high) |  |  | [property-wide] We love making our inn a welcoming place for your entire family, including pets and children! — lodginginnapavalley.com/policies |
| 34 |  Camellia Inn | — | YES(high) | YES(high) |  |  | [property-wide] we kindly request that guests traveling with young children carefully consider our accommodations, as our property is best suited  — camelliainn.com/polic |
| 35 |  Candlelight Inn Napa Valley | NO | NO(high) | NO(high) |  |  | [property-wide] Candlelight Inn Napa Valley was developed for an adult clientele seeking a tranquil atmosphere and is therefore unsuitable for chi — candlelightinn.com/po |
| 36 |  Carneros Resort and Spa | YES | YES(high) | YES(high) |  |  | [property-wide] Enjoy the family-friendly adventures of Napa Valley at Carneros Resort and Spa, where the gentle rhythm of wine country blends sea — carnerosresort.com/fa |
| 37 |  Castello Victorian Inn | — | NO(low) | NO(low) |  |  |  |
| 38 |  Chateau de Vie | — | NO(low) | NO(low) |  |  |  |
| 39 |  Cottage Grove Inn | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 40 |  Cottage Inn & Spa | YES | YES(high) | YES(high) |  |  | [property-wide] The Cottage Inn & Spa is designed to provide a quiet and restful retreat for guests seeking relaxation and privacy and is not reco — cottageinnsonoma.com/ |
| 41 |  Cottages On River Road | — | NO(low) | YES(high) |  |  | [property-wide] accommodate families, couples, friends and solo travelers — cottagesonriverroad.com |
| 42 |  Craftsman Inn | — | YES(high) | YES(high) |  |  | [property-wide] We love making our inn a welcoming place for your entire family, including pets and children! — lodginginnapavalley.com/policies |
| 43 |  Creekside Inn & Resort | YES | YES(high) | NO(low) |  |  |  |
| 44 |  Dr. Wilkinson's Backyard Resort & Mine | NO | NO(high) | NO(high) |  |  | [property-wide] ADULTS ONLY ZEN ZONE — drwilkinson.com/faq |
| 45 |  Duchamp Healdsburg | YES | YES(high) | YES(high) |  |  | [property-wide] we welcome children 13 years and older. — duchamphotel.com/hotel-policies |
| 46 |  El Bonita Motel | YES | YES(high) | NO(low) |  |  | [event-specific] This family-friendly event is a relaxing way to enjoy your Saturday morning and listen to music while you stroll through the Calis — elbonita.com/visit |
| 47 |  Fairfield by Marriott Inn & Suites San | YES | YES(high) | YES(high) |  |  | [property-wide] Family-Friendly Beach Resorts in Florida — marriott.com |
| 48 |  Fairmont Sonoma Mission Inn & Spa | — | NO(low) | NO(low) |  |  |  |
| 49 |  Farmhouse Inn | — | YES(high) | YES(high) |  |  | [property-wide] Minor children must be accompanied by an adult at all times on property. — farmhouseinn.com/pages/frequently-asked-questions |
| 50 |  Four Seasons Resort and Residences Nap | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 51 |  Gaige House | — | YES(high) | YES(high) |  |  | [property-wide] Children five years and younger stay for free. — thegaigehouse.com/policies |
| 52 |  Geyserville Inn | — | NO(high) | NO(high) |  |  | (no quote) No quotes regarding children or families were found, indicating that there are no family-friendly options available. |
| 53 |  Golden Haven Spa LLC | — | NO(low) | NO(low) |  |  |  |
| 54 |  Grape Leaf Inn | YES | YES(high) | YES(high) |  |  | [property-wide] While we welcome all families, we kindly request that guests traveling with young children carefully consider our accommodations,  — grapeleafinn.com/poli |
| 55 |  Guerneville Lodge | — | YES(high) | YES(high) |  |  | [property-wide] Children are allowed on the tour but there are no special reservation beds for them. — guernevillelodge.com |
| 56 |  h2hotel | — | NO(low) | NO(low) |  |  | (no quote) No information found regarding children or family policies. |
| 57 |  Hampton Inn Petaluma | — | NO(low) | NO(low) |  |  | (no quote) No quotes regarding children or family policies were found. |
| 58 |  Harmon Guest House | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 59 |  Harvest Inn | — | YES(high) | YES(high) |  |  | [property-wide] Yes, children are welcome at Harvest Inn. — harvestinn.com/faq |
| 60 |  Highlands Resort | NO | NO(high) | NO(high) |  |  | [property-wide] We are an adult property. All guests must be at least 18 years old. — highlandsresort.com/policies |
| 61 |  Hotel Healdsburg | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 62 |  Hotel Napa Valley, an Ascend Collectio | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 63 |  Hotel Petaluma | — | YES(high) | NO(low) |  |  | (no quote) No information found regarding children or family policies. |
| 64 |  Hotel Petaluma, Tapestry Collection by | — | NO(low) | NO(low) |  |  | (no quote) No relevant information about children or family policies was found on the website. |
| 65 |  Hotel Trio Healdsburg | YES | YES(high) | YES(high) |  |  | [property-wide] Room to Play by the Shore Family-Friendly Beach Resorts in Florida From early morning seashell hunts and splash-happy afternoons t — marriott.com |
| 66 |  Hotel Villagio at The Estate Yountvill | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 67 |  Hotel Yountville | — | NO(low) | NO(low) |  |  | (no quote) No relevant information about children or family policies was found on the website. |
| 68 |  Inn at Salvestrin Winery | — | YES(high) | YES(high) |  |  | [experience-specific] *Our estate experience is both kid and pet friendly. — salvestrinwinery.com/visit |
| 69 |  Inn At Sonoma, A Four Sisters Inn | YES | YES(high) | YES(high) |  |  | [property-wide] Are children welcome to stay at the hotel? — innatsonoma.com/faq |
| 70 |  Inn on the Russian River | — | NO(low) | NO(low) |  |  |  |
| 71 |  Inn St. Helena | — | YES(high) | YES(high) |  |  | [property-wide] Children 16 and over are welcome and must be supervised at all times. — innsthelena.com/pages/frequently-asked-questions |
| 72 |  Johnson's Beach - Cabins and Campgroun | YES | YES(high) | YES(high) |  |  | [property-wide] Children under 12 must be supervised by an adult at all times. — johnsonsbeach.com/policies |
| 73 |  Kenwood Inn & Spa | YES | YES(high) | YES(high) |  |  | [property-wide] Children five years and younger stay for free. — kenwoodinn.com/policies |
| 74 |  Lavender, A Four Sisters Inn | — | YES(high) | YES(high) |  |  | [property-wide] Children five years and younger stay for free. — lavendernapa.com/policies |
| 75 |  Le Petit Pali St. Helena | — | NO(low) | NO(low) |  |  | (no quote) No quotes regarding children or family policies were found. |
| 76 |  MacArthur Place Hotel & Spa | — | NO(low) | NO(low) |  |  | [property-wide] We do not have on-demand babysitting services on property, but we would be happy to recommend local nannies and babysitters that a — macarthurplace.com/fa |
| 77 |  Maison Fleurie, A Four Sisters Inn | — | YES(high) | YES(high) |  |  | [property-wide] Children five years and younger stay for free. — maisonfleurienapa.com/policies |
| 78 |  Meadowlark Country House & Resort | NO | NO(high) | NO(high) |  |  | [property-wide] Meadowlark, an adults-only resort for guests 18 and up. — meadowlarkinn.com |
| 79 |  Meadowood Napa Valley | YES | YES(high) | NO(low) |  |  | (no quote) No evidence found |
| 80 |  Metro Hotel & Cafe | — | NO(low) | NO(low) |  |  |  |
| 81 |  Milliken Creek Inn | YES | YES(high) | YES(high) |  |  | [property-wide] Children under the age of 12 are never to be left alone in the room or on the property unattended. — millikencreekinn.com/policies |
| 82 |  Montage Healdsburg | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 83 |  Mount View Hotel & Spa | NO | NO(low) | NO(high) |  |  | [property-wide] Is your hotel adults only? — mountviewhotel.com/faq |
| 84 |  Napa River Inn | — | NO(low) | NO(low) |  |  |  |
| 85 |  Napa Valley Lodge | YES | YES(high) | NO(low) |  |  | (no quote) No relevant information found regarding children or family policies. |
| 86 |  R INN NAPA | — | NO(high) | NO(high) |  |  | [property-wide] Our boutique hotel is suitable for adults ages 18 and over. — rinnnapa.com/faq |
| 87 |  R3 Hotel | — | NO(low) | NO(low) |  |  |  |
| 88 |  Rancho Caymus Inn | — | YES(high) | YES(high) |  |  | [property-wide] We welcome well-behaved children of all ages. — ranchocaymusinn.com/faq |
| 89 |  River Bend Resort | YES | YES(high) | YES(high) |  |  | [property-wide] we have 3 children’s play structures — riverbendresort.net |
| 90 |  River Terrace Inn | YES | YES(high) | YES(high) |  |  | [property-wide] Room to Play by the Shore Family-Friendly Beach Resorts in Florida — marriott.com |
| 91 |  Roman Spa Hot Springs Resort | — | YES(high) | YES(high) |  |  | [property-wide] Children under the age of four are not permitted in our pools or inside our gated pool area. — romanspahotsprings.com/faq |
| 92 |  SENZA Hotel | — | NO(low) | NO(low) |  |  | (no quote) There are no quotes found regarding children or family policies. |
| 93 |  Silverado Resort | — | YES(high) | YES(high) |  |  | [property-wide] Spa services are only available to guests 18 years and older. — silveradoresort.com/faq |
| 94 |  Solage, Auberge Collection | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 95 |  Sonoma Bungalows | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 96 |  Sonoma Creek Inn | YES | YES(high) | YES(high) |  |  | [property-wide] We welcome families and children. — sonomacreekinn.com/policies |
| 97 |  Sonoma Hotel | YES | YES(high) | YES(high) |  |  | [property-wide] We do have a port-a-crib for guests that need one. — sonomahotel.com/policies |
| 98 |  Sonoma Valley Inn, Tapestry Collection | — | NO(low) | NO(low) |  |  | (no quote) No relevant information about children or family policies was found on the website. |
| 99 |  Southbridge Napa Valley | — | NO(low) | NO(low) |  |  |  |
| 100 |  Stanly Ranch, Auberge Collection | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 101 |  Sttupa Estate Napa Valley | — | NO(high) | NO(high) |  |  | [property-wide] No, given the nature of the guest experience, Sttupa Estate is an adults-only property. — sttupaestate.com/faq |
| 102 |  Surrey Resort | — | YES(high) | YES(high) |  |  | [property-wide] It was nice to go camping but still have a fridge, wifi and firepit when you've got a 2 yo with you. — surreyrr.com |
| 103 |  THE BERGSON | — | YES(high) | YES(high) |  |  | [property-wide] Yes. Kids under 13 stay free, with an adult reserving a guest room. — thebergson.com/faqs |
| 104 |  The Bungalows at Calistoga | — | YES(high) | YES(high) |  |  | [property-wide] Best for: Families, leisure riders, beginner cyclists — thebungalowsatcalistoga.com/family |
| 105 |  The Cottages of Napa Valley | — | YES(high) | YES(high) |  |  | [property-wide] the cottages are best suited for adults and guests 13 and older. — napacottages.com/policies |
| 106 |  The Estate Yountville | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 107 |  The Francis House | — | NO(low) | NO(low) |  |  |  |
| 108 |  The George | YES | YES(high) | YES(high) |  |  | [property-wide] * Children above 12 years of age are considered an adult. — thegeorgenapa.com/faq |
| 109 |  The Lodge at Bodega Bay | YES | YES(high) | YES(high) |  |  | [property-wide] There is no additional charge for children 12 and under staying in an adult’s room. — lodgeatbodegabay.com/info-policies |
| 110 |  The Lodge at Sonoma Resort, Autograph  | YES | YES(high) | YES(high) |  |  | [property-wide] Room to Play by the Shore Family-Friendly Beach Resorts in Florida From early morning seashell hunts and splash-happy afternoons t — marriott.com |
| 111 |  The Madrona | — | YES(high) | YES(high) |  |  | [property-wide] Yes, Pack ‘n Plays are available upon request. — themadronahotel.com/faq |
| 112 |  The Ranch At Lake Sonoma | — | NO(low) | NO(low) |  |  |  |
| 113 |  The Setting Inn Napa Valley | — | NO(low) | NO(low) |  |  |  |
| 114 |  The Spa at The Lodge at Sonoma | YES | YES(high) | YES(high) |  |  | [property-wide] these Sonoma County kids activities strike the perfect balance. — thelodgeatsonoma.com/family |
| 115 |  The Stavrand Russian River Valley | — | YES(high) | YES(high) |  |  | [property-wide] We welcome families with children. — thestavrand.com/faq |
| 116 |  The Swiss Hotel | — | NO(low) | NO(low) |  |  |  |
| 117 |  Two Thirty-Five Luxury Suites | — | YES(high) | YES(high) |  |  | [property-wide] full-size cribs and highchairs are available by request. — twothirty-five.com/faq |
| 118 |  UpValley Inn & Hot Springs Napa Valley | — | NO(low) | NO(high) |  |  | (no quote) No information found regarding children or family-friendly experiences, indicating that the property does not accommodat |
| 119 |  Vignoble | — | NO(low) | NO(low) |  |  |  |
| 120 |  Vinarosa Resort & Spa | — | YES(high) | YES(high) |  |  | [property-wide] Family Friendly Amenities — vinarosaresort.com/resort-policies/ |
| 121 |  Vineyard Country Inn | — | NO(low) | NO(low) |  |  |  |
| 122 |  Vino Bello Resort | YES | NO(low) | NO(low) |  |  | (no quote) No evidence found |
| 123 |  Vintage House at The Estate Yountville | — | NO(low) | NO(low) |  |  | (no quote) There are no quotes regarding children or family policies found on the website. |
| 124 |  West Sonoma Inn & Spa | — | NO(low) | NO(low) |  |  |  |
| 125 |  White House Napa | — | NO(low) | NO(low) |  |  | (no quote) No information regarding children or family policies was found on the website. |
| 126 |  Wildhaven Sonoma Glamping | — | YES(high) | YES(high) |  |  | [property-wide] Children must sleep in beds and Wildhaven cannot add cots to these tents due to space limitations. — wildhavensonoma.com/faq |
| 127 |  Wydown Hotel | — | NO(low) | NO(low) |  |  | (no quote) No evidence found |

---

## Summary Counts

| Amenity | 🔴 Prod vs new-v3 | 🟡 Any diff | ✅ Agree |
|---|---|---|---|
| Dog | 8 | 8 | 119 |
| Kid | 10 | 15 | 112 |

**Legend:**
- 🔴 = Prod vs new-v3 disagreement (needs review)
- 🟡 = Any other disagreement (low-priority, mostly old-v3 errors now corrected)
- 🆕 = Accommodation not in new-v3 audit (3 missing)
- ⚠️ = v3 disagrees with manual correction (manual wins)
- Scope `[property-wide]` is most authoritative; `[experience-specific]` means a specific offering; `[event-specific]` means a dated event

## Recommendations

1. **🟢 Apply 14 ACCEPT_V3 value changes** — all have solid property-wide quotes
2. **🟢 Apply 55 new adds** (Category A — prod was NULL, new-v3 has high-conf evidence)
3. **🔵 Skip 2 KEEP_PROD** — v3 classifier errors (Westin Verasa wrong page, Johnson's Beach backwards)
4. **Skip manual-correction overlap** — 24 accommodations have manual overrides that always win
5. **Source URL refreshes** where values already match but v3 has better FAQ URL
