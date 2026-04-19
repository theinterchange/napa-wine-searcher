import { haversineDistance, estimateSegment } from "@/lib/geo";
import type {
  DriveTimeProvider,
  DriveTimePoint,
  DriveTimeResult,
} from "./types";

const UNCERTAINTY = 0.15;

export const freeEstimateProvider: DriveTimeProvider = {
  source: "free_estimate",
  async compute(from: DriveTimePoint, to: DriveTimePoint): Promise<DriveTimeResult> {
    const straight = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    const { miles, minutes } = estimateSegment(straight);
    return {
      miles,
      minutes,
      minRangeMinutes: minutes * (1 - UNCERTAINTY),
      maxRangeMinutes: minutes * (1 + UNCERTAINTY),
      source: "free_estimate",
      computedAt: new Date().toISOString(),
    };
  },
  async computeMany(legs) {
    return Promise.all(legs.map((leg) => this.compute(leg.from, leg.to)));
  },
};
