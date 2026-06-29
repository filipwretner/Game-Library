/** Pure date helpers shared by both sides. */

/** Original release year from an ISO date string, or null when absent/invalid. */
export function releaseYear(isoDate: string | null): number | null {
  if (isoDate === null) return null;
  const year = new Date(isoDate).getUTCFullYear();
  return Number.isNaN(year) ? null : year;
}
