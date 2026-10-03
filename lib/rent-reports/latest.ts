import { aggregateRentHistory } from "@/lib/rent-reports/aggregate";
import type { RentHistoryGroup } from "@/types/property";

export type LatestRent = { amount: number; year: number; bedrooms: number };

export function latestReportedRent(groups: RentHistoryGroup[]): LatestRent | null {
  let best: LatestRent | null = null;
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

export function latestRentsByProperty(
  reports: Array<{
    property_id: string;
    bedrooms: number;
    monthly_rent: number | string;
    lease_start_year: number | null;
  }>,
): Record<string, LatestRent> {
  const grouped = new Map<
    string,
    { bedrooms: number; monthly_rent: number; lease_start_year: number | null }[]
  >();
  for (const report of reports) {
    const list = grouped.get(report.property_id) ?? [];
    list.push({
      bedrooms: report.bedrooms,
      monthly_rent: Number(report.monthly_rent),
      lease_start_year: report.lease_start_year,
    });
    grouped.set(report.property_id, list);
  }
  const result: Record<string, LatestRent> = {};
  for (const [id, rows] of grouped) {
    const latest = latestReportedRent(aggregateRentHistory(rows));
    if (latest) result[id] = latest;
  }
  return result;
}
