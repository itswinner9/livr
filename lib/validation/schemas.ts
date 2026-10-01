import { z } from "zod";
import { normalizePostalCode, normalizeProvince, normalizeUnit, PROVINCE_CODES } from "@/lib/address/normalize";
import { PROPERTY_TYPES } from "@/types/property";
import { FLAG_REASONS, RENTER_STATUSES } from "@/types/database";
import { REVIEW_SORTS } from "@/types/review";

const CURRENT_YEAR = new Date().getFullYear();

/** Treats empty form strings as "not provided". */
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const optionalInt = (min: number, max: number, label: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ message: `${label} must be a number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );

const optionalRating = (label: string) => optionalInt(1, 5, label);

const requiredRating = (label: string) =>
  z.coerce
    .number({ message: `${label} is required` })
    .int()
    .min(1, `${label} is required`)
    .max(5);

const optionalMoney = (label: string, max = 100_000) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ message: `${label} must be a number` })
      .positive(`${label} must be greater than 0`)
      .max(max, `${label} looks too high`)
      .optional(),
  );

const optionalNonNegativeMoney = (label: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number({ message: `${label} must be a number` }).min(0).max(10_000, `${label} looks too high`).optional(),
  );

const bathrooms = z.preprocess(
  blankToUndefined,
  z.coerce
    .number({ message: "Bathrooms must be a number" })
    .min(0)
    .max(10)
    .refine((v) => Number.isInteger(v * 2), "Use whole or half bathrooms (e.g. 1.5)")
    .optional(),
);

const year = (label: string) => optionalInt(1950, CURRENT_YEAR + 1, label);

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const uuid = z.uuid({ message: "Invalid identifier" });

export const renterStatusSchema = z.enum(RENTER_STATUSES, { message: "Choose current or former renter" });

export const reviewSchema = z
  .object({
    propertyId: uuid,
    overall_rating: z.coerce
      .number({ message: "Overall rating is required" })
      .int()
      .min(1, "Overall rating is required")
      .max(5),
    maintenance_rating: requiredRating("Maintenance rating"),
    management_rating: requiredRating("Management rating"),
    noise_rating: requiredRating("Noise rating"),
    cleanliness_rating: requiredRating("Cleanliness rating"),
    building_condition_rating: requiredRating("Building condition rating"),
    parking_rating: optionalRating("Parking rating"),
    value_rating: requiredRating("Value rating"),
    review_title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title must be at most 150 characters"),
    review_body: z
      .string()
      .trim()
      .min(50, "Please write at least 50 characters about your experience")
      .max(10_000, "Reviews can be at most 10,000 characters"),
    bedrooms: optionalInt(0, 10, "Bedrooms"),
    bathrooms,
    monthly_rent: optionalMoney("Monthly rent"),
    move_in_year: year("Move-in year"),
    move_out_year: year("Move-out year"),
    renter_status: renterStatusSchema,
    public_display_name: checkbox,
    unit_label: z.preprocess(blankToUndefined, z.string().trim().max(20).optional()).refine(
      (v) => v == null || normalizeUnit(v) != null,
      { message: "Use a short unit number such as 1204, 12B, or PH2." },
    ),
  })
  .refine((v) => v.move_out_year == null || v.move_in_year == null || v.move_out_year >= v.move_in_year, {
    path: ["move_out_year"],
    message: "Move-out year cannot be before move-in year",
  })
  .refine((v) => !(v.renter_status === "current" && v.move_out_year != null && v.move_out_year < CURRENT_YEAR), {
    path: ["move_out_year"],
    message: "Current renters should leave move-out year blank",
  });
export type ReviewInput = z.infer<typeof reviewSchema>;

export const rentReportSchema = z
  .object({
    propertyId: uuid,
    bedrooms: z.coerce
      .number({ message: "Bedrooms is required" })
      .int("Bedrooms must be a whole number")
      .min(0)
      .max(10),
    bathrooms,
    monthly_rent: z.coerce
      .number({ message: "Monthly rent is required" })
      .positive("Monthly rent must be greater than 0")
      .min(100, "Monthly rent looks too low")
      .max(100_000, "Monthly rent looks too high"),
    parking_cost: optionalNonNegativeMoney("Parking cost"),
    storage_cost: optionalNonNegativeMoney("Storage cost"),
    utilities_included: z.preprocess(
      (v) => (v === "yes" ? true : v === "no" ? false : undefined),
      z.boolean().optional(),
    ),
    lease_start_year: year("Lease start year"),
    lease_end_year: year("Lease end year"),
    renter_status: renterStatusSchema,
    notes: optionalText(1000),
  })
  .refine(
    (v) => v.lease_end_year == null || v.lease_start_year == null || v.lease_end_year >= v.lease_start_year,
    { path: ["lease_end_year"], message: "Lease end year cannot be before lease start year" },
  );
export type RentReportInput = z.infer<typeof rentReportSchema>;

export const flagSchema = z.object({
  reviewId: uuid,
  reason: z.enum(FLAG_REASONS, { message: "Choose a reason" }),
  details: optionalText(1000),
});

export const voteSchema = z.object({
  reviewId: uuid,
  vote: z.enum(["helpful", "not_helpful"]),
});

export const reviewReplySchema = z.object({
  reviewId: uuid,
  body: z
    .string()
    .trim()
    .min(20, "Replies must be at least 20 characters")
    .max(1000, "Replies can be at most 1,000 characters"),
});

export const profileSchema = z.object({
  display_name: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .min(1)
      .max(60, "Display name must be at most 60 characters")
      .refine((v) => !/[@]|\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(v), "Don't include email addresses or phone numbers")
      .optional(),
  ),
});

export const managerResponseSchema = z.object({
  reviewId: uuid,
  propertyId: uuid,
  response_body: z
    .string()
    .trim()
    .min(10, "Responses must be at least 10 characters")
    .max(3000, "Responses can be at most 3,000 characters"),
});

export const claimSchema = z.object({
  propertyId: uuid,
  verification_method: z.enum(["business_email", "document", "phone", "other"]),
  company_name: optionalText(120),
  notes: optionalText(2000),
});

export const propertySchema = z.object({
  address_line_1: z
    .string()
    .trim()
    .min(3, "Enter the street address")
    .max(200)
    .refine((v) => /\d/.test(v), "Include the civic (street) number"),
  address_line_2: optionalText(100),
  city: z.string().trim().min(2, "Enter the city").max(100),
  province: z.preprocess(
    (v) => (typeof v === "string" ? normalizeProvince(v) ?? v : v),
    z.enum(PROVINCE_CODES, { message: "Choose a Canadian province or territory" }),
  ),
  postal_code: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .refine((v) => normalizePostalCode(v) !== null, "Enter a valid Canadian postal code (e.g. V3T 1A1)")
      .optional(),
  ),
  building_name: optionalText(120),
  property_type: z.preprocess(blankToUndefined, z.enum(PROPERTY_TYPES).optional()),
  year_built: optionalInt(1800, CURRENT_YEAR + 1, "Year built"),
  units_count: optionalInt(1, 5000, "Units"),
  latitude: z.preprocess(blankToUndefined, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(blankToUndefined, z.coerce.number().min(-180).max(180).optional()),
  provider_place_id: optionalText(200),
});
export type PropertyInput = z.infer<typeof propertySchema>;
export const propertyCreateSchema = propertySchema;

export const searchSchema = z.object({
  q: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().trim().max(200)),
  province: z.preprocess(blankToUndefined, z.enum(PROVINCE_CODES).optional()),
  city: optionalText(100),
  type: z.preprocess(blankToUndefined, z.enum(PROPERTY_TYPES).optional()),
});

export const reviewListSchema = z.object({
  sort: z.preprocess(blankToUndefined, z.enum(REVIEW_SORTS).default("recent")),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(500).default(1)),
});

export const aiAskSchema = z.object({
  question: z
    .string()
    .trim()
    .min(5, "Ask a slightly longer question")
    .max(500, "Questions can be at most 500 characters"),
  propertyId: z.preprocess(blankToUndefined, uuid.optional()),
});

export const moderationDecisionSchema = z.object({
  targetId: uuid,
  decision: z.enum(["approve", "reject", "hide"]),
  reason: optionalText(500),
});

export type FieldErrors = Record<string, string[] | undefined>;

export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$")) out[key] = value;
  }
  return out;
}

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
