import type { ContentStatus, RenterStatus, VerifiedStatus } from "./database";

export const RATING_CATEGORIES = [
  "overall",
  "maintenance",
  "management",
  "noise",
  "cleanliness",
  "building_condition",
  "parking",
  "value",
] as const;
export type RatingCategory = (typeof RATING_CATEGORIES)[number];

export const RATING_CATEGORY_LABELS: Record<RatingCategory, string> = {
  overall: "Overall",
  maintenance: "Maintenance",
  management: "Management",
  noise: "Noise",
  cleanliness: "Cleanliness",
  building_condition: "Building condition",
  parking: "Parking",
  value: "Value",
};

export type RatingFields = {
  overall_rating: number;
  maintenance_rating: number | null;
  management_rating: number | null;
  noise_rating: number | null;
  cleanliness_rating: number | null;
  building_condition_rating: number | null;
  parking_rating: number | null;
  value_rating: number | null;
};

/** Shape of the `public_reviews` view: no user IDs, emails, or unit numbers. */
export interface PublicReview extends RatingFields {
  id: string;
  property_id: string;
  review_title: string;
  review_body: string;
  bedrooms: number | null;
  bathrooms: number | null;
  move_in_year: number | null;
  move_out_year: number | null;
  renter_status: RenterStatus;
  author_display_name: string | null;
  unit_id?: string | null;
  unit_key?: string | null;
  verified_status: VerifiedStatus;
  helpful_count: number;
  not_helpful_count: number;
  is_demo: boolean;
  published_at: string | null;
  created_at: string;
}

export interface OwnReview extends RatingFields {
  id: string;
  property_id: string;
  review_title: string;
  review_body: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export const REVIEW_TOPICS = [
  "maintenance",
  "management",
  "noise",
  "parking",
  "security",
  "elevator",
  "heating",
  "water",
  "plumbing",
  "cleanliness",
  "pests",
  "neighbours",
  "rent_increases",
  "building_condition",
  "amenities",
  "transit",
  "location",
] as const;
export type ReviewTopic = (typeof REVIEW_TOPICS)[number];

export const REVIEW_TOPIC_LABELS: Record<ReviewTopic, string> = {
  maintenance: "Maintenance",
  management: "Management",
  noise: "Noise",
  parking: "Parking",
  security: "Security",
  elevator: "Elevator",
  heating: "Heating",
  water: "Water",
  plumbing: "Plumbing",
  cleanliness: "Cleanliness",
  pests: "Pests",
  neighbours: "Neighbours",
  rent_increases: "Rent increases",
  building_condition: "Building condition",
  amenities: "Amenities",
  transit: "Transit",
  location: "Location",
};

export const REVIEW_SORTS = ["recent", "highest", "lowest", "helpful"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const REVIEW_SORT_LABELS: Record<ReviewSort, string> = {
  recent: "Most recent",
  highest: "Highest rated",
  lowest: "Lowest rated",
  helpful: "Most helpful",
};

export interface PublicManagementResponse {
  id: string;
  review_id: string;
  property_id: string;
  response_body: string;
  created_at: string;
}

export interface PublicReviewReply {
  id: string;
  review_id: string;
  body: string;
  author_display_name: string | null;
  published_at: string | null;
  created_at: string;
}

export interface OwnPendingReply {
  id: string;
  review_id: string;
  body: string;
  status: "pending";
  created_at: string;
}

export type Review = RatingFields & {
  id: string;
  property_id: string;
  review_title: string;
  review_body: string;
  bedrooms: number | null;
  bathrooms: number | null;
  move_in_year: number | null;
  move_out_year: number | null;
  renter_status: RenterStatus;
  verified_status: VerifiedStatus;
  helpful_count: number;
  created_at: string;
  user_id?: string;
  status?: ContentStatus;
  public_display_name?: boolean;
  display_name?: string | null;
  monthly_rent?: number | null;
  author_display_name?: string | null;
  not_helpful_count?: number;
  is_demo?: boolean;
  published_at?: string | null;
  unit_id?: string | null;
  unit_key?: string | null;
};

export interface PropertyIssue {
  topic: ReviewTopic;
  mentions: number;
}
