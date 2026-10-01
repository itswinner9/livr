import type { RatingSummary } from "@/types/property";

export type RatingRow = {
  overall_rating: number;
  maintenance_rating: number | null;
  management_rating: number | null;
  noise_rating: number | null;
  cleanliness_rating: number | null;
  building_condition_rating: number | null;
  parking_rating: number | null;
  value_rating: number | null;
};

function avg(values: number[]) {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function calculateRatingSummary(reviews: RatingRow[]): RatingSummary {
  const published = reviews;
  return {
    overall: avg(published.map((r) => r.overall_rating)),
    maintenance: avg(
      published
        .map((r) => r.maintenance_rating)
        .filter((v): v is number => v != null),
    ),
    management: avg(
      published
        .map((r) => r.management_rating)
        .filter((v): v is number => v != null),
    ),
    noise: avg(
      published.map((r) => r.noise_rating).filter((v): v is number => v != null),
    ),
    cleanliness: avg(
      published
        .map((r) => r.cleanliness_rating)
        .filter((v): v is number => v != null),
    ),
    building_condition: avg(
      published
        .map((r) => r.building_condition_rating)
        .filter((v): v is number => v != null),
    ),
    parking: avg(
      published
        .map((r) => r.parking_rating)
        .filter((v): v is number => v != null),
    ),
    value: avg(
      published.map((r) => r.value_rating).filter((v): v is number => v != null),
    ),
    reviewCount: published.length,
  };
}
