import type { RentHistoryGroup } from "@/types/property";

export function latestReportedRent(groups: RentHistoryGroup[]) {
  let best: { amount: number; year: number; bedrooms: number } | null = null;
  for (const group of groups) {
    for (const year of group.years) {
      const amount = year.median ?? year.rents[0];
      if (amount == null) continue;
      if (!best || year.year > best.year) {
        best = { amount, year: year.year, bedrooms: group.bedrooms };
      }
    }
  }
  return best;
}
