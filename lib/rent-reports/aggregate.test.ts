import { describe, expect, it } from "vitest";
import { bedroomLabel, median, summarizeRent } from "./aggregate";

const point = (bedrooms: number, rent: number, year: number | null = 2025) => ({
  bedrooms,
  monthly_rent: rent,
  lease_start_year: year,
  created_at: "2025-06-01T00:00:00Z",
});

describe("median", () => {
  it("handles odd, even and empty inputs", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1750, 1850, 1950, 2050])).toBe(1900);
    expect(median([])).toBeNull();
  });
});

describe("summarizeRent", () => {
  it("groups by bedrooms and year", () => {
    const s = summarizeRent([
      point(1, 1750, 2024),
      point(1, 1850, 2025),
      point(1, 1950, 2026),
      point(2, 2450, 2025),
    ]);
    expect(s.totalReports).toBe(4);
    expect(s.groups.map((g) => g.label)).toEqual(["1 Bedroom", "2 Bedrooms"]);
    expect(s.groups[0].years.map((y) => y.year)).toEqual([2024, 2025, 2026]);
  });

  it("computes min/max/median only with enough data points", () => {
    const s = summarizeRent([point(1, 1750), point(1, 1850), point(1, 1950), point(2, 2450), point(2, 2550)]);
    expect(s.groups[0].stats).toEqual({ count: 3, min: 1750, max: 1950, median: 1850 });
    expect(s.groups[1].stats).toBeNull();
    expect(s.groups[1].years[0].median).toBeNull();
    expect(s.groups[1].years[0].values).toEqual([2450, 2550]);
  });

  it("falls back to submission year and drops invalid rows", () => {
    const s = summarizeRent([point(0, 1500, null), point(1, -5), point(1, Number.NaN)]);
    expect(s.totalReports).toBe(1);
    expect(s.groups[0].label).toBe("Studio");
    expect(s.groups[0].years[0].year).toBe(2025);
  });

  it("accepts numeric strings from Postgres numeric columns", () => {
    const s = summarizeRent([{ ...point(1, 0), monthly_rent: "1800.00" }]);
    expect(s.groups[0].years[0].values).toEqual([1800]);
  });
});

describe("bedroomLabel", () => {
  it("labels studios", () => {
    expect(bedroomLabel(0)).toBe("Studio");
    expect(bedroomLabel(3)).toBe("3 Bedrooms");
  });
});
