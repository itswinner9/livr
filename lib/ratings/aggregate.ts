import { RATING_CATEGORIES, type RatingCategory, type RatingFields } from "@/types/review";

/** Minimum published reviews (per category) before LivRank shows a numeric score. */
export const MIN_REVIEWS_FOR_RATING = 1;

export interface CategoryScore {
  category: RatingCategory;
  average: number | null;
  count: number;
  sufficient: boolean;
}

export interface RatingSummary {
  reviewCount: number;
  overall: CategoryScore;
  categories: CategoryScore[];
}

const FIELD: Record<RatingCategory, keyof RatingFields> = {
  overall: "overall_rating",
  maintenance: "maintenance_rating",
  management: "management_rating",
  noise: "noise_rating",
  cleanliness: "cleanliness_rating",
  building_condition: "building_condition_rating",
  parking: "parking_rating",
  value: "value_rating",
};

function isValidRating(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

/**
 * Aggregates ratings from **published** reviews only. Callers must never pass pending,
 * rejected, or hidden reviews. Scores are withheld (null) when evidence is insufficient.
 */
export function aggregateRatings(
  reviews: readonly Partial<RatingFields>[],
  minCount = MIN_REVIEWS_FOR_RATING,
): RatingSummary {
  const scores = RATING_CATEGORIES.map((category): CategoryScore => {
    const values = reviews.map((r) => r[FIELD[category]]).filter(isValidRating);
    const count = values.length;
    const sufficient = count >= minCount;
    const average = sufficient
      ? Math.round((values.reduce((a, b) => a + b, 0) / count) * 10) / 10
      : null;
    return { category, average, count, sufficient };
  });
  return {
    reviewCount: reviews.length,
    overall: scores[0],
    categories: scores.slice(1),
  };
}

/** Display rating for search cards from the denormalized property average. */
export function publicOverallRating(avg: number | string | null, reviewCount: number): number | null {
  if (avg == null || reviewCount < MIN_REVIEWS_FOR_RATING) return null;
  const n = typeof avg === "string" ? Number(avg) : avg;
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}
