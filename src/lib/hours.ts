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
