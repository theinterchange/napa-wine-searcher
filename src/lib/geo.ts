const EARTH_RADIUS_MILES = 3958.8;

/** Haversine distance between two lat/lng points in miles */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Apply 1.3x multiplier for wine-country winding roads */
export function estimatedDrivingMiles(straightLineMiles: number): number {
  return straightLineMiles * 1.3;
}

/** Estimate driving minutes at ~30 mph average for wine country roads */
export function estimatedDrivingMinutes(drivingMiles: number): number {
  return (drivingMiles / 30) * 60;
}

export function formatDistance(miles: number): string {
  return miles < 1 ? `${(miles * 5280).toFixed(0)} ft` : `${miles.toFixed(1)} mi`;
}

export function formatDriveTime(minutes: number): string {
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/** Compute distance segments between consecutive stops */
export function computeSegments(
  stops: { lat: number | null; lng: number | null }[]
): { miles: number; minutes: number }[] {
  const segments: { miles: number; minutes: number }[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
      const straight = haversineDistance(a.lat, a.lng, b.lat, b.lng);
      const miles = estimatedDrivingMiles(straight);
      segments.push({ miles, minutes: estimatedDrivingMinutes(miles) });
    } else {
      segments.push({ miles: 0, minutes: 0 });
    }
  }
  return segments;
}

/** Build a Google Maps directions URL with ordered waypoints */
export function buildGoogleMapsUrl(
  stops: { lat: number | null; lng: number | null; name: string }[],
  originCoords?: { lat: number; lng: number } | null
): string | null {
  const valid = stops.filter((s) => s.lat != null && s.lng != null);
  if (valid.length < 1) return null;
  if (valid.length < 2 && !originCoords) return null;

  const origin = originCoords
    ? `${originCoords.lat},${originCoords.lng}`
    : `${valid[0].lat},${valid[0].lng}`;
  const destination = `${valid[valid.length - 1].lat},${valid[valid.length - 1].lng}`;

  // When origin is provided, all stops are waypoints except the last (destination)
  const waypointStops = originCoords ? valid.slice(0, -1) : valid.slice(1, -1);
  const waypoints = waypointStops.map((s) => `${s.lat},${s.lng}`).join("|");

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Total distance of a route in miles */
export function totalRouteMiles(
  stops: { lat: number | null; lng: number | null }[]
): number {
  return computeSegments(stops).reduce((sum, s) => sum + s.miles, 0);
}

/**
 * For N <= 8 stops, find optimal ordering by trying all permutations.
 * For N > 8, use nearest-neighbor heuristic.
 * Returns reordered indices.
 */
export function optimizeStopOrder(
  stops: { lat: number; lng: number }[]
): number[] {
  if (stops.length <= 1) return stops.map((_, i) => i);

  if (stops.length <= 8) {
    return bruteForceOptimal(stops);
  }
  return nearestNeighborOrder(stops);
}

function bruteForceOptimal(stops: { lat: number; lng: number }[]): number[] {
  const indices = stops.map((_, i) => i);
  let bestOrder = [...indices];
  let bestDist = Infinity;

  for (const perm of permutations(indices)) {
    let dist = 0;
    for (let i = 0; i < perm.length - 1; i++) {
      dist += haversineDistance(
        stops[perm[i]].lat,
        stops[perm[i]].lng,
        stops[perm[i + 1]].lat,
        stops[perm[i + 1]].lng
      );
      if (dist >= bestDist) break;
    }
    if (dist < bestDist) {
      bestDist = dist;
      bestOrder = [...perm];
    }
  }
  return bestOrder;
}

function* permutations(arr: number[]): Generator<number[]> {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i], ...perm];
    }
  }
}

function nearestNeighborOrder(stops: { lat: number; lng: number }[]): number[] {
  const visited = new Set<number>();
  const order: number[] = [0];
  visited.add(0);

  while (order.length < stops.length) {
    const last = stops[order[order.length - 1]];
    let nearest = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < stops.length; i++) {
      if (visited.has(i)) continue;
      const d = haversineDistance(last.lat, last.lng, stops[i].lat, stops[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    order.push(nearest);
    visited.add(nearest);
  }
  return order;
}
