/** Minimum renter reports before min/max/median statistics are shown. */
export const MIN_RENT_POINTS_FOR_STATS = 3;

export interface RentPoint {
  bedrooms: number;
  monthly_rent: number | string;
  lease_start_year: number | null;
  created_at: string;
}

export interface RentStats {
  count: number;
  min: number;
  max: number;
  median: number;
}

export interface RentYearRow {
  year: number;
  count: number;
  median: number | null;
  values: number[];
}

export interface RentGroup {
  bedrooms: number;
  label: string;
  count: number;
  stats: RentStats | null;
  years: RentYearRow[];
}

export interface RentSummary {
  totalReports: number;
  groups: RentGroup[];
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(m);
}

export function bedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} Bedroom${bedrooms === 1 ? "" : "s"}`;
}

export function computeStats(values: readonly number[], min = MIN_RENT_POINTS_FOR_STATS): RentStats | null {
  if (values.length < min) return null;
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    median: median(values)!,
  };
}

/** Groups **published** renter-reported rent by bedroom count and year. */
export function summarizeRent(points: readonly RentPoint[], min = MIN_RENT_POINTS_FOR_STATS): RentSummary {
  const valid = points
    .map((p) => ({ ...p, rent: Number(p.monthly_rent) }))
    .filter((p) => Number.isFinite(p.rent) && p.rent > 0 && Number.isInteger(p.bedrooms) && p.bedrooms >= 0);

  const byBedrooms = new Map<number, typeof valid>();
  for (const p of valid) {
    const list = byBedrooms.get(p.bedrooms) ?? [];
    list.push(p);
    byBedrooms.set(p.bedrooms, list);
  }

  const groups: RentGroup[] = [...byBedrooms.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bedrooms, list]) => {
      const byYear = new Map<number, number[]>();
      for (const p of list) {
        const year = p.lease_start_year ?? new Date(p.created_at).getFullYear();
        const arr = byYear.get(year) ?? [];
        arr.push(p.rent);
        byYear.set(year, arr);
      }
      const years = [...byYear.entries()]
        .sort(([a], [b]) => a - b)
        .map(([year, values]) => ({
          year,
          count: values.length,
          median: values.length >= min ? median(values) : null,
          values: [...values].sort((a, b) => a - b),
        }));
      return {
        bedrooms,
        label: bedroomLabel(bedrooms),
        count: list.length,
        stats: computeStats(list.map((p) => p.rent), min),
        years,
      };
    });

  return { totalReports: valid.length, groups };
}

export function aggregateRentHistory(
  reports: { bedrooms: number; monthly_rent: number; lease_start_year: number | null }[],
) {
  const summary = summarizeRent(
    reports.map((r) => ({
      bedrooms: r.bedrooms,
      monthly_rent: r.monthly_rent,
      lease_start_year: r.lease_start_year,
      created_at: new Date().toISOString(),
    })),
  );
  return summary.groups.map((g) => ({
    bedrooms: g.bedrooms,
    years: g.years.map((y) => ({
      year: y.year,
      rents: y.values,
      count: y.count,
      median: y.median,
      min: y.values.length >= MIN_RENT_POINTS_FOR_STATS ? Math.min(...y.values) : null,
      max: y.values.length >= MIN_RENT_POINTS_FOR_STATS ? Math.max(...y.values) : null,
    })),
  }));
}
