import { buildNormalizedAddress, parseSearchQuery } from "@/lib/address/normalize";
import { createServerSupabase } from "@/lib/supabase/server";
import { calculateRatingSummary } from "@/lib/ratings/summary";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import { aggregateRentHistory } from "@/lib/rent-reports/aggregate";
import { completeProperty, type IssueMention, type Property, type RatingSummary, type RentHistoryGroup } from "@/types/property";
import type { OwnPendingReply, PublicReviewReply, Review } from "@/types/review";
import { isUuid } from "@/lib/utils";
import { cache } from "react";

function mapProperty(row: Record<string, unknown>): Property {
  return completeProperty({
    id: String(row.id),
    address_line_1: String(row.address_line_1),
    address_line_2: (row.address_line_2 as string) ?? null,
    city: String(row.city),
    province: String(row.province),
    postal_code: (row.postal_code as string) ?? null,
    country: String(row.country ?? "Canada"),
    building_name: (row.building_name as string) ?? null,
    property_type: (row.property_type as Property["property_type"]) ?? null,
    year_built: (row.year_built as number) ?? null,
    units_count: (row.units_count as number) ?? null,
    latitude: row.latitude == null || row.latitude === "" ? null : Number(row.latitude),
    longitude: row.longitude == null || row.longitude === "" ? null : Number(row.longitude),
    normalized_address: String(row.normalized_address ?? ""),
    slug: (row.slug as string) ?? null,
    review_count: Number(row.review_count ?? 0),
    rent_report_count: Number(row.rent_report_count ?? 0),
    avg_overall_rating: row.avg_overall_rating == null ? null : Number(row.avg_overall_rating),
    last_review_date: (row.last_review_date as string) ?? null,
    last_rent_report_date: (row.last_rent_report_date as string) ?? null,
    has_manager: Boolean(row.has_manager),
    has_ai_summary: Boolean(row.has_ai_summary),
    is_demo: Boolean(row.is_demo),
    merged_into_id: (row.merged_into_id as string) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  });
}

export type ListingFilters = {
  city?: string;
  province?: string;
  propertyType?: string;
  hasReviews?: boolean;
  hasRent?: boolean;
};

function logQueryError(where: string, error: { message: string } | null | undefined) {
  if (error) console.error(`[livrank] ${where}: ${error.message}`);
}

function matchesListingFilters(p: Property, filters: ListingFilters) {
  if (filters.city && p.city !== filters.city) return false;
  if (filters.province && p.province !== filters.province) return false;
  if (filters.propertyType && p.property_type !== filters.propertyType) return false;
  if (filters.hasReviews && p.review_count < 1) return false;
  if (filters.hasRent && p.rent_report_count < 1) return false;
  return true;
}

export async function searchProperties(
  query: string,
  filters: ListingFilters = {},
): Promise<Property[]> {
  const parsed = parseSearchQuery(query);
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("search_properties", {
    p_query: parsed.normalized,
    p_limit: 25,
    p_province: filters.province ?? null,
  });
  logQueryError("search_properties", error);
  return ((data ?? []) as Record<string, unknown>[])
    .map(mapProperty)
    .filter((p) => matchesListingFilters(p, filters));
}

export async function browseListings(filters: ListingFilters = {}, limit = 24): Promise<Property[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  let q = supabase.from("public_properties").select("*");
  if (filters.city) q = q.eq("city", filters.city);
  if (filters.province) q = q.eq("province", filters.province);
  if (filters.propertyType) q = q.eq("property_type", filters.propertyType);
  if (filters.hasReviews) q = q.gt("review_count", 0);
  if (filters.hasRent) q = q.gt("rent_report_count", 0);
  const { data, error } = await q
    .order("last_review_date", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false })
    .limit(limit);
  logQueryError("browseListings", error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapProperty);
}

export async function listListingFacets() {
  const rows = await listPublicProperties(50);
  const cities = [...new Set(rows.map((p) => p.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const provinces = [...new Set(rows.map((p) => p.province).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const types = [...new Set(rows.map((p) => p.property_type).filter((t): t is NonNullable<typeof t> => Boolean(t)))];
  const cityCounts = Object.fromEntries(
    cities.map((city) => [city, rows.filter((property) => property.city === city).length]),
  );
  const placeMap = new Map<string, { city: string; province: string; count: number }>();
  for (const property of rows) {
    const key = `${property.city}|${property.province}`;
    const current = placeMap.get(key);
    if (current) current.count += 1;
    else placeMap.set(key, { city: property.city, province: property.province, count: 1 });
  }
  const cityPlaces = [...placeMap.values()].sort((a, b) => a.city.localeCompare(b.city));
  return {
    cities,
    provinces,
    types,
    cityCounts,
    cityPlaces,
    buildingCount: rows.length,
    reviewCount: rows.reduce((sum, property) => sum + property.review_count, 0),
    rentReportCount: rows.reduce((sum, property) => sum + property.rent_report_count, 0),
  };
}

export const getPropertyById = cache(async function getPropertyById(id: string): Promise<Property | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const column = isUuid(id) ? "id" : "slug";
  const { data, error } = await supabase
    .from("public_properties")
    .select("*")
    .eq(column, id)
    .maybeSingle();
  logQueryError("getPropertyById", error);
  if (data) return mapProperty(data);
  if (column === "id") return null;
  const { data: redirect } = await supabase
    .from("property_slug_redirects")
    .select("property_id")
    .eq("slug", id)
    .maybeSingle();
  return redirect ? getPropertyById(String(redirect.property_id)) : null;
});

export type ContributionProperty = Property & { status: "active" | "pending" };

/**
 * Loads a property a signed-in renter may contribute to: public ones, plus pending pages
 * proposed through address search that aren't public until their first approved contribution.
 */
export async function getPropertyForContribution(id: string): Promise<ContributionProperty | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.rpc("get_contribution_property", { p_id_or_slug: id });
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return { ...mapProperty(row), status: row.status === "pending" ? "pending" : "active" };
}

/** Finds a live (active or pending) property for a normalized address or Mapbox place id. */
export async function findPropertyForAddress(normalizedAddress: string, placeId: string | null) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .rpc("lookup_property_for_address", {
      p_normalized_address: normalizedAddress,
      p_provider_place_id: placeId,
    })
    .maybeSingle<{ id: string; slug: string | null; status: "active" | "pending" }>();
  return data ?? null;
}

export async function getPropertyBySlug(slug: string) {
  return getPropertyById(slug);
}

/** Public listings from the live database. */
export async function listPublicProperties(limit = 8): Promise<Property[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("public_properties")
    .select("*")
    .order("last_review_date", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false })
    .limit(limit);
  logQueryError("listPublicProperties", error);
  return ((data ?? []) as Record<string, unknown>[]).map(mapProperty);
}

export async function getFeaturedProperty(): Promise<Property | null> {
  const rows = await listPublicProperties(12);
  return rows.find((p) => p.review_count > 0) ?? rows[0] ?? null;
}

export async function listNearbyProperties(property: Property, limit = 5): Promise<Property[]> {
  const rows = await listPublicProperties(50);
  return rows
    .filter((row) => row.id !== property.id && row.city === property.city)
    .slice(0, limit);
}

export function searchExamplesFrom(properties: Property[], max = 3): string[] {
  const seen = new Set<string>();
  const examples: string[] = [];
  for (const p of properties) {
    const candidates = [
      `${p.address_line_1}, ${p.city}, ${p.province}`,
      p.postal_code,
      p.building_name,
    ];
    for (const value of candidates) {
      const next = value?.trim();
      if (!next || seen.has(next.toLowerCase())) continue;
      seen.add(next.toLowerCase());
      examples.push(next);
      if (examples.length >= max) return examples;
    }
  }
  return examples;
}

export type PublicPropertyUnit = {
  id: string;
  property_id: string;
  unit_key: string;
  review_count: number;
  avg_overall_rating: number | null;
  last_review_date: string | null;
};

export async function getPropertyUnits(propertyId: string): Promise<PublicPropertyUnit[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_property_units")
    .select("id, property_id, unit_key, review_count, avg_overall_rating, last_review_date")
    .eq("property_id", propertyId)
    .order("unit_key", { ascending: true });
  return (data ?? []) as PublicPropertyUnit[];
}

export async function getUnitReviews(propertyId: string, unitKey: string) {
  const key = unitKey.trim().toUpperCase();
  if (!key) return { unit: null as PublicPropertyUnit | null, reviews: [] as Review[] };
  const supabase = await createServerSupabase();
  if (!supabase) return { unit: null as PublicPropertyUnit | null, reviews: [] as Review[] };
  const [{ data: unit }, { data: reviews }] = await Promise.all([
    supabase
      .from("public_property_units")
      .select("id, property_id, unit_key, review_count, avg_overall_rating, last_review_date")
      .eq("property_id", propertyId)
      .eq("unit_key", key)
      .maybeSingle(),
    supabase
      .from("public_reviews")
      .select("*")
      .eq("property_id", propertyId)
      .eq("unit_key", key)
      .order("created_at", { ascending: false }),
  ]);
  return {
    unit: (unit as PublicPropertyUnit | null) ?? null,
    reviews: (reviews ?? []) as Review[],
  };
}

export async function getPropertyReviews(
  id: string,
  opts: { sort?: string; page?: number; pageSize?: number } = {},
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 10;
  const sort = opts.sort ?? "recent";
  const supabase = await createServerSupabase();
  if (!supabase) return { reviews: [] as Review[], total: 0 };
  let q = supabase
    .from("public_reviews")
    .select("*", { count: "exact" })
    .eq("property_id", id);
  if (sort === "highest") q = q.order("overall_rating", { ascending: false });
  else if (sort === "lowest") q = q.order("overall_rating", { ascending: true });
  else if (sort === "helpful") q = q.order("helpful_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  const from = (page - 1) * pageSize;
  const { data, count } = await q.range(from, from + pageSize - 1);
  return {
    reviews: ((data ?? []) as Review[]).map((row) => ({
      ...row,
      unit_key: row.unit_key ?? null,
      unit_id: row.unit_id ?? null,
    })),
    total: count ?? 0,
  };
}

function groupByReviewId<T extends { review_id: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.review_id) ?? [];
    list.push(row);
    map.set(row.review_id, list);
  }
  return map;
}

export async function getPublishedRepliesByReview(reviewIds: string[]) {
  const empty = new Map<string, PublicReviewReply[]>();
  if (reviewIds.length === 0) return empty;
  const supabase = await createServerSupabase();
  if (!supabase) return empty;
  const { data } = await supabase
    .from("public_review_replies")
    .select("id, review_id, body, author_display_name, published_at, created_at")
    .in("review_id", reviewIds)
    .order("created_at", { ascending: true });
  return groupByReviewId((data ?? []) as PublicReviewReply[]);
}

export async function getOwnPendingRepliesByReview(reviewIds: string[], userId: string) {
  const empty = new Map<string, OwnPendingReply[]>();
  if (reviewIds.length === 0) return empty;
  const supabase = await createServerSupabase();
  if (!supabase) return empty;
  const { data } = await supabase
    .from("review_replies")
    .select("id, review_id, body, status, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .in("review_id", reviewIds)
    .order("created_at", { ascending: true });
  return groupByReviewId((data ?? []) as OwnPendingReply[]);
}

export async function getPropertyRatingSummary(id: string): Promise<RatingSummary> {
  const supabase = await createServerSupabase();
  const { data } = supabase
    ? await supabase
        .from("public_reviews")
        .select(
          "overall_rating, maintenance_rating, management_rating, noise_rating, cleanliness_rating, building_condition_rating, parking_rating, value_rating",
        )
        .eq("property_id", id)
    : { data: null };
  const summary = calculateRatingSummary(data ?? []);
  if (summary.reviewCount >= MIN_REVIEWS_FOR_RATING) return summary;
  return {
    overall: null,
    maintenance: null,
    management: null,
    noise: null,
    cleanliness: null,
    building_condition: null,
    parking: null,
    value: null,
    reviewCount: summary.reviewCount,
  };
}

export async function getPropertyRentHistory(id: string): Promise<RentHistoryGroup[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_rent_reports")
    .select("bedrooms, monthly_rent, lease_start_year")
    .eq("property_id", id);
  return aggregateRentHistory(data ?? []);
}

export async function getPropertyIssues(id: string): Promise<IssueMention[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_property_topics")
    .select("topic, mentions")
    .eq("property_id", id)
    .order("mentions", { ascending: false })
    .limit(8);
  return (data ?? []) as IssueMention[];
}

export async function getPropertyAiSummary(id: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("property_ai_summaries")
    .select("summary_text, source_review_count, status")
    .eq("property_id", id)
    .eq("status", "ready")
    .maybeSingle();
  return data;
}

export async function getSavedProperties(userId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data: saved } = await supabase
    .from("saved_properties")
    .select("property_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const ids = (saved ?? []).map((row) => String(row.property_id));
  if (ids.length === 0) return [];
  const { data } = await supabase.from("public_properties").select("*").in("id", ids);
  const byId = new Map((data ?? []).map((row) => [String(row.id), mapProperty(row)]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Property[];
}

export const getPropertyPageData = cache(async function getPropertyPageData(id: string) {
  const property = await getPropertyById(id);
  if (!property) return null;
  const [ratingSummary, reviewPage, rentSummary, issues, aiSummary] =
    await Promise.all([
      getPropertyRatingSummary(property.id),
      getPropertyReviews(property.id, { page: 1, pageSize: 10 }),
      getPropertyRentHistory(property.id),
      getPropertyIssues(property.id),
      getPropertyAiSummary(property.id),
    ]);
  return {
    property,
    ratingSummary,
    reviewCount: ratingSummary.reviewCount,
    rentSummary,
    issues,
    recentReviews: reviewPage.reviews,
    reviewTotal: reviewPage.total,
    aiSummary,
  };
});

export async function getComparePageData(id: string) {
  const property = await getPropertyById(id);
  if (!property) return null;
  const [ratingSummary, rentSummary, issues] = await Promise.all([
    getPropertyRatingSummary(property.id),
    getPropertyRentHistory(property.id),
    getPropertyIssues(property.id),
  ]);
  return { property, ratingSummary, rentSummary, issues };
}

export function propertyLabel(p: Pick<Property, "address_line_1" | "city" | "province">) {
  return `${p.address_line_1}, ${p.city} ${p.province}`;
}

export function normalizedFromInput(input: {
  address_line_1: string;
  city: string;
  province: string;
}) {
  return buildNormalizedAddress(input);
}
