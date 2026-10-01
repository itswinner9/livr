import { describe, expect, it } from "vitest";
import { aggregateRatings, publicOverallRating } from "./aggregate";

const review = (overall: number, extra: Record<string, number | null> = {}) => ({
  overall_rating: overall,
  maintenance_rating: null,
  management_rating: null,
  noise_rating: null,
  cleanliness_rating: null,
  building_condition_rating: null,
  parking_rating: null,
  value_rating: null,
  ...extra,
});

describe("aggregateRatings", () => {
  it("withholds scores when there are no published reviews", () => {
    const s = aggregateRatings([]);
    expect(s.overall.average).toBeNull();
    expect(s.overall.sufficient).toBe(false);
    expect(s.overall.count).toBe(0);
  });

  it("averages to one decimal from published reviews", () => {
    const s = aggregateRatings([review(5), review(4)]);
    expect(s.overall.average).toBe(4.5);
    expect(s.overall.sufficient).toBe(true);
    expect(s.reviewCount).toBe(2);
  });

  it("computes categories independently and skips missing values", () => {
    const s = aggregateRatings([
      review(4, { maintenance_rating: 3, noise_rating: 5 }),
      review(3, { maintenance_rating: 2 }),
      review(5, { maintenance_rating: 4 }),
    ]);
    const maintenance = s.categories.find((c) => c.category === "maintenance")!;
    const noise = s.categories.find((c) => c.category === "noise")!;
    expect(maintenance.average).toBe(3);
    expect(noise.average).toBe(5);
    expect(noise.count).toBe(1);
  });

  it("ignores out-of-range values instead of fabricating scores", () => {
    const s = aggregateRatings([review(4), review(9), review(0), review(5)]);
    expect(s.overall.count).toBe(2);
    expect(s.overall.average).toBe(4.5);
  });
});

describe("publicOverallRating", () => {
  it("shows a rating once a published review exists", () => {
    expect(publicOverallRating(4.123, 1)).toBe(4.1);
    expect(publicOverallRating("4.15", 2)).toBe(4.2);
    expect(publicOverallRating(4.5, 0)).toBeNull();
    expect(publicOverallRating(null, 10)).toBeNull();
  });
});
