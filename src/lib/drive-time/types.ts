export type DriveTimeSource =
  | "free_estimate"
  | "distance_matrix_live"
  | "distance_matrix_cached";

export type DriveTimeResult = {
  miles: number;
  minutes: number;
  minRangeMinutes: number;
  maxRangeMinutes: number;
  source: DriveTimeSource;
  computedAt: string;
};

export type DriveTimePoint = {
  lat: number;
  lng: number;
};

export interface DriveTimeProvider {
  readonly source: DriveTimeSource;
  compute(from: DriveTimePoint, to: DriveTimePoint): Promise<DriveTimeResult>;
  computeMany(
    legs: Array<{ from: DriveTimePoint; to: DriveTimePoint }>
  ): Promise<DriveTimeResult[]>;
}
