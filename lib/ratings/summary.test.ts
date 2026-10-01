import { describe, expect, it } from "vitest";
import { calculateRatingSummary } from "@/lib/ratings/summary";

describe("rating summary", () => {
  it("ignores empty lists", () => {
    expect(calculateRatingSummary([]).overall).toBeNull();
    expect(calculateRatingSummary([]).reviewCount).toBe(0);
  });

  it("averages published rows only as provided", () => {
    const summary = calculateRatingSummary([
      {
        overall_rating: 4,
        maintenance_rating: 2,
        management_rating: null,
        noise_rating: 5,
        cleanliness_rating: 4,
        building_condition_rating: 4,
        parking_rating: 3,
        value_rating: 3,
      },
      {
        overall_rating: 2,
        maintenance_rating: 4,
        management_rating: 3,
        noise_rating: 3,
        cleanliness_rating: 2,
        building_condition_rating: 2,
        parking_rating: 3,
        value_rating: 3,
      },
    ]);
    expect(summary.overall).toBe(3);
    expect(summary.maintenance).toBe(3);
    expect(summary.management).toBe(3);
  });
});
