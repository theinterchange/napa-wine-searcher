/** Parse hoursJson and check if a winery is open on a given day */
export function isOpenOnDay(hoursJson: string | null, day: string): boolean {
  if (!hoursJson) return true; // assume open if no data
  try {
    const hours = JSON.parse(hoursJson);
    const val = hours[day];
    return val != null && val !== "Closed";
  } catch {
    return true;
  }
}

/** Get the hours string for a given day, e.g. "10:00-17:00" */
export function getHoursForDay(
  hoursJson: string | null,
  day: string
): string | null {
  if (!hoursJson) return null;
  try {
    const hours = JSON.parse(hoursJson);
    const val = hours[day];
    return val && val !== "Closed" ? val : null;
  } catch {
    return null;
  }
}

const SCHEMA_DAY: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface OpeningHoursSpec {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
}

/** Convert hoursJson into schema.org OpeningHoursSpecification array */
export function hoursToSchema(
  hoursJson: string | null
): OpeningHoursSpec[] | null {
  if (!hoursJson) return null;
  try {
    const hours = JSON.parse(hoursJson) as Record<string, string | null>;
    const out: OpeningHoursSpec[] = [];
    for (const [key, value] of Object.entries(hours)) {
      const day = SCHEMA_DAY[key];
      if (!day || !value || value === "Closed") continue;
      const m = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.exec(value);
      if (!m) continue;
      out.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day,
        opens: m[1],
        closes: m[2],
      });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}
