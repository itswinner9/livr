export const ROLES = ["user", "moderator", "admin", "manager"] as const;
export type Role = (typeof ROLES)[number];

export const SUBSCRIPTION_STATUSES = [
  "free",
  "premium",
  "manager_pro",
  "manager_portfolio",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const CONTENT_STATUSES = ["pending", "published", "rejected", "hidden"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const RENTER_STATUSES = ["current", "former"] as const;
export type RenterStatus = (typeof RENTER_STATUSES)[number];

export const VERIFIED_STATUSES = ["unverified", "verified"] as const;
export type VerifiedStatus = (typeof VERIFIED_STATUSES)[number];

export const PROPERTY_STATUSES = ["proposed", "active", "hidden", "merged"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const FLAG_REASONS = [
  "spam",
  "personal_information",
  "harassment",
  "threat",
  "unsupported_accusation",
  "fake_or_misleading",
  "not_a_renter_experience",
  "other",
] as const;
export type FlagReason = (typeof FLAG_REASONS)[number];

export const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;
export type ProvinceCode = (typeof PROVINCES)[number];

export type Database = Record<string, never>;
