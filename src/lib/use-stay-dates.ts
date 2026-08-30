"use client";

import { useSyncExternalStore } from "react";
import type { StayDates } from "@/lib/affiliate";

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeNextWeekend(): StayDates {
  const now = new Date();
  // Target a Friday ~2 weeks out: close enough to feel relevant, far enough
  // that small/boutique properties (which book up close-in) are more likely to
  // show live availability and a price rather than "sold out". The user can
  // change the dates on the OTA — this is only a smart default.
  const daysUntilFriday = ((5 - now.getDay() + 7) % 7) || 7;
  const checkin = new Date(now);
  checkin.setDate(now.getDate() + daysUntilFriday + 7);
  const checkout = new Date(checkin);
  checkout.setDate(checkin.getDate() + 2); // 2-night weekend → Sunday
  return { checkin: fmt(checkin), checkout: fmt(checkout) };
}

// Computed once per client session and cached so getSnapshot returns a stable
// reference (required by useSyncExternalStore — a fresh object each call would
// loop).
let cached: StayDates | undefined;
function getClientSnapshot(): StayDates | undefined {
  if (!cached) cached = computeNextWeekend();
  return cached;
}
const getServerSnapshot = (): StayDates | undefined => undefined;
const subscribe = () => () => {};

/**
 * Default "next weekend" stay dates (Fri check-in → Sun check-out) for
 * pre-filling hotel booking links, so the user lands on a priced result
 * instead of an empty date picker.
 *
 * Returns `undefined` during SSR and the first client render, then the
 * computed dates once hydrated — via useSyncExternalStore, so there is no
 * hydration mismatch and no setState-in-effect. The user can still change the
 * dates on the OTA; this is only a smart default.
 */
export function useDefaultStayDates(): StayDates | undefined {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
