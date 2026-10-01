import { describe, expect, it } from "vitest";
import { aiAskSchema, flagSchema, profileSchema, propertySchema, rentReportSchema, reviewSchema } from "./schemas";

const PROPERTY_ID = "10000000-0000-4000-8000-000000000001";
const body = "The building was quiet and maintenance took about two weeks to fix my dishwasher.";

const baseReview = {
  propertyId: PROPERTY_ID,
  overall_rating: "4",
  maintenance_rating: "4",
  management_rating: "4",
  noise_rating: "4",
  cleanliness_rating: "4",
  building_condition_rating: "4",
  value_rating: "4",
  review_title: "Quiet building",
  review_body: body,
  renter_status: "former",
};

describe("reviewSchema", () => {
  it("accepts a minimal valid review and coerces form values", () => {
    const r = reviewSchema.parse({ ...baseReview, parking_rating: "", bedrooms: "1", public_display_name: "on" });
    expect(r.overall_rating).toBe(4);
    expect(r.maintenance_rating).toBe(4);
    expect(r.parking_rating).toBeUndefined();
    expect(r.bedrooms).toBe(1);
    expect(r.public_display_name).toBe(true);
  });

  it("requires core category ratings and keeps parking optional", () => {
    expect(reviewSchema.safeParse({ ...baseReview, maintenance_rating: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...baseReview, value_rating: undefined }).success).toBe(false);
    expect(reviewSchema.parse({ ...baseReview }).parking_rating).toBeUndefined();
  });

  it("requires at least 50 characters of body text", () => {
    const r = reviewSchema.safeParse({ ...baseReview, review_body: "Too short." });
    expect(r.success).toBe(false);
  });

  it("caps body length at 10,000 characters", () => {
    const r = reviewSchema.safeParse({ ...baseReview, review_body: "a".repeat(10_001) });
    expect(r.success).toBe(false);
  });

  it("rejects ratings outside 1-5", () => {
    expect(reviewSchema.safeParse({ ...baseReview, overall_rating: "6" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...baseReview, overall_rating: "0" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...baseReview, noise_rating: "7" }).success).toBe(false);
  });

  it("rejects move-out before move-in", () => {
    const r = reviewSchema.safeParse({ ...baseReview, move_in_year: "2024", move_out_year: "2022" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["move_out_year"]);
  });

  it("rejects non-positive rent and unreasonable bedrooms", () => {
    expect(reviewSchema.safeParse({ ...baseReview, monthly_rent: "0" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...baseReview, bedrooms: "25" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...baseReview, bathrooms: "1.3" }).success).toBe(false);
  });

  it("rejects invalid property ids", () => {
    expect(reviewSchema.safeParse({ ...baseReview, propertyId: "../../etc" }).success).toBe(false);
  });

  it("accepts optional unit labels and rejects free text", () => {
    expect(reviewSchema.parse({ ...baseReview, unit_label: "1204" }).unit_label).toBe("1204");
    expect(reviewSchema.parse({ ...baseReview, unit_label: "" }).unit_label).toBeUndefined();
    expect(reviewSchema.safeParse({ ...baseReview, unit_label: "this is a slur" }).success).toBe(false);
  });
});

describe("rentReportSchema", () => {
  const base = { propertyId: PROPERTY_ID, bedrooms: "1", monthly_rent: "1850", renter_status: "current" };

  it("accepts valid reports", () => {
    const r = rentReportSchema.parse({ ...base, utilities_included: "yes", parking_cost: "" });
    expect(r.monthly_rent).toBe(1850);
    expect(r.utilities_included).toBe(true);
    expect(r.parking_cost).toBeUndefined();
  });

  it("requires rent greater than zero", () => {
    expect(rentReportSchema.safeParse({ ...base, monthly_rent: "-100" }).success).toBe(false);
    expect(rentReportSchema.safeParse({ ...base, monthly_rent: "" }).success).toBe(false);
  });

  it("validates lease year order", () => {
    expect(rentReportSchema.safeParse({ ...base, lease_start_year: "2025", lease_end_year: "2024" }).success).toBe(false);
  });
});

describe("other schemas", () => {
  it("validates flags", () => {
    expect(flagSchema.safeParse({ reviewId: PROPERTY_ID, reason: "spam" }).success).toBe(true);
    expect(flagSchema.safeParse({ reviewId: PROPERTY_ID, reason: "dislike" }).success).toBe(false);
  });

  it("keeps contact details out of display names", () => {
    expect(profileSchema.safeParse({ display_name: "me@example.com" }).success).toBe(false);
    expect(profileSchema.safeParse({ display_name: "604-555-1234" }).success).toBe(false);
    expect(profileSchema.parse({ display_name: "  Sam  " }).display_name).toBe("Sam");
  });

  it("normalizes province names and validates postal codes on properties", () => {
    const p = propertySchema.parse({ address_line_1: "123 Main St", city: "Surrey", province: "British Columbia" });
    expect(p.province).toBe("BC");
    expect(propertySchema.safeParse({ address_line_1: "Main St", city: "Surrey", province: "BC" }).success).toBe(false);
    expect(
      propertySchema.safeParse({ address_line_1: "1 Main", city: "Surrey", province: "BC", postal_code: "90210" }).success,
    ).toBe(false);
  });

  it("bounds AI questions", () => {
    expect(aiAskSchema.safeParse({ question: "hi" }).success).toBe(false);
    expect(aiAskSchema.safeParse({ question: "Is maintenance slow here?", propertyId: "" }).success).toBe(true);
  });
});
