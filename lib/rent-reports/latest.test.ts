import { describe, expect, it } from "vitest";
import { latestRentsByProperty } from "./latest";

describe("latestRentsByProperty", () => {
  it("groups the latest reported rent for each property", () => {
    const result = latestRentsByProperty([
      { property_id: "a", bedrooms: 1, monthly_rent: 1800, lease_start_year: 2023 },
      { property_id: "a", bedrooms: 2, monthly_rent: 2400, lease_start_year: 2025 },
      { property_id: "b", bedrooms: 1, monthly_rent: 1650, lease_start_year: 2024 },
    ]);
    expect(result.a).toEqual({ amount: 2400, year: 2025, bedrooms: 2 });
    expect(result.b).toEqual({ amount: 1650, year: 2024, bedrooms: 1 });
  });

  it("ignores older years on the same building", () => {
    const result = latestRentsByProperty([
      { property_id: "a", bedrooms: 1, monthly_rent: 1500, lease_start_year: 2022 },
      { property_id: "a", bedrooms: 1, monthly_rent: 1900, lease_start_year: 2026 },
    ]);
    expect(result.a).toEqual({ amount: 1900, year: 2026, bedrooms: 1 });
  });
});
