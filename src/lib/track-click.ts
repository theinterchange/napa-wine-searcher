export interface TrackClickParams {
  wineryId?: number | null;
  clickType: "website" | "book_tasting" | "buy_wine" | "affiliate" | "directions";
  destinationUrl: string;
  sourcePage?: string;
  sourceComponent?: string;
}

export function trackClick(params: TrackClickParams) {
  const body = JSON.stringify(params);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/clicks", body);
  } else {
    fetch("/api/clicks", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}
