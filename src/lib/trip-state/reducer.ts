import type { Trip, TripMutation, TripMutationResult, TripStop } from "./types";

export function applyMutation(trip: Trip, m: TripMutation): TripMutationResult {
  switch (m.type) {
    case "add_stop": {
      const stops = [...trip.stops];
      const idx = Math.max(0, Math.min(m.atIndex, stops.length));
      stops.splice(idx, 0, m.stop);
      return {
        next: { ...trip, stops },
        inverse: { type: "remove_stop", wineryId: m.stop.wineryId },
      };
    }
    case "remove_stop": {
      const idx = trip.stops.findIndex((s) => s.wineryId === m.wineryId);
      if (idx === -1) return { next: trip, inverse: null };
      const removed = trip.stops[idx];
      const stops = trip.stops.filter((_, i) => i !== idx);
      return {
        next: { ...trip, stops },
        inverse: { type: "add_stop", stop: removed, atIndex: idx },
      };
    }
    case "swap_stop": {
      const idx = trip.stops.findIndex((s) => s.wineryId === m.oldWineryId);
      if (idx === -1) return { next: trip, inverse: null };
      const previous = trip.stops[idx];
      const stops = [...trip.stops];
      stops[idx] = m.newStop;
      return {
        next: { ...trip, stops },
        inverse: {
          type: "swap_stop",
          oldWineryId: m.newStop.wineryId,
          newStop: previous,
        },
      };
    }
    case "reorder": {
      if (m.fromIndex === m.toIndex) return { next: trip, inverse: null };
      const stops = [...trip.stops];
      const [moved] = stops.splice(m.fromIndex, 1);
      stops.splice(m.toIndex, 0, moved);
      return {
        next: { ...trip, stops },
        inverse: { type: "reorder", fromIndex: m.toIndex, toIndex: m.fromIndex },
      };
    }
    case "set_origin": {
      const previous = trip.origin;
      return {
        next: { ...trip, origin: m.origin },
        inverse: { type: "set_origin", origin: previous },
      };
    }
    case "reset_to_curated": {
      const previousStops = trip.stops;
      return {
        next: { ...trip, stops: m.originalStops },
        inverse: { type: "reset_to_curated", originalStops: previousStops },
      };
    }
  }
}

export function tripStopIdsSignature(stops: TripStop[]): string {
  return stops.map((s) => s.wineryId).join(",");
}
