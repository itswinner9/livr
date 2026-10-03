import "server-only";

import { MOVE_CHECKLIST_STEPS, type HomeNoteTopic, type MoveChecklistStep } from "@/lib/daily/checklist";
import { currentYearMonth, todayLabel } from "@/lib/daily/dates";
import type {
  CityPulseItem,
  DailyNotification,
  HomeNote,
  LeaseDates,
  SavedSearch,
  SavedSearchMatch,
  TodayData,
} from "@/lib/daily/types";
import { LISTINGS_TAG } from "@/lib/cache/listings";
import { demoProperties, demoRentReports, demoReviews } from "@/lib/demo/data";
import { cityCanonicalPath, placeSlug, propertyCanonicalPath } from "@/lib/seo";
import { createPublicSupabase } from "@/lib/supabase/public";
import { createServerSupabase } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { formatCad, formatDate } from "@/lib/utils";
import { completeProperty, type Property, type PropertyType } from "@/types/property";
import { getSavedProperties } from "@/lib/properties/queries";

function mapPropertyLite(row: Record<string, unknown>): Property {
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
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
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

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function getNotifications(userId: string, limit = 40): Promise<DailyNotification[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DailyNotification[];
}

export async function getHomeProperty(userId: string): Promise<Property | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data: saved } = await supabase
    .from("saved_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("is_home", true)
    .maybeSingle();
  if (!saved?.property_id) return null;
  const { data } = await supabase.from("public_properties").select("*").eq("id", saved.property_id).maybeSingle();
  return data ? mapPropertyLite(data as Record<string, unknown>) : null;
}

export async function getCityPulse(city: string, province: string): Promise<CityPulseItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    const buildings = demoProperties.filter((property) => property.city === city && property.province === province);
    const ids = new Set(buildings.map((property) => property.id));
    const byId = new Map(buildings.map((property) => [property.id, property]));
    const reviews = demoReviews
      .filter((review) => ids.has(review.property_id) && review.status === "published")
      .slice(0, 3)
      .map((review) => {
        const property = byId.get(review.property_id);
        return {
          id: `review-${review.id}`,
          title: review.review_title,
          href: property ? propertyCanonicalPath(property) : "/explore",
          hint: `New review · ${property?.address_line_1 ?? "Building"}`,
          published_at: review.published_at ?? null,
        };
      });
    const rents = demoRentReports
      .filter((report) => ids.has(report.property_id))
      .slice(0, 2)
      .map((report) => {
        const property = byId.get(report.property_id);
        return {
          id: `rent-${report.property_id}-${report.monthly_rent}`,
          title: `${formatCad(report.monthly_rent)} reported`,
          href: property ? propertyCanonicalPath(property) : "/explore",
          hint: property ? `${property.address_line_1}` : "Reported rent",
          published_at: report.lease_start_year ? `${report.lease_start_year}-01-01` : null,
        };
      });
    return [...reviews, ...rents];
  }

  const { data: buildings } = await supabase
    .from("public_properties")
    .select("id, slug, address_line_1, city, province, last_review_date, last_rent_report_date")
    .eq("city", city)
    .eq("province", province)
    .limit(48);
  const rows = buildings ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((row) => String(row.id));
  const byId = new Map(rows.map((row) => [String(row.id), row]));

  const [{ data: reviews }, { data: rents }] = await Promise.all([
    supabase
      .from("public_reviews")
      .select("id, property_id, review_title, published_at")
      .in("property_id", ids)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("public_rent_reports")
      .select("id, property_id, monthly_rent, bedrooms, published_at")
      .in("property_id", ids)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(4),
  ]);

  const items: CityPulseItem[] = [];
  for (const review of reviews ?? []) {
    const property = byId.get(String(review.property_id));
    if (!property) continue;
    items.push({
      id: `review-${review.id}`,
      title: String(review.review_title),
      href: `/property/${property.slug || property.id}`,
      hint: `New review · ${property.address_line_1}`,
      published_at: (review.published_at as string) ?? null,
    });
  }
  for (const rent of rents ?? []) {
    const property = byId.get(String(rent.property_id));
    if (!property) continue;
    items.push({
      id: `rent-${rent.id}`,
      title: `${formatCad(Number(rent.monthly_rent))} reported`,
      href: `/property/${property.slug || property.id}`,
      hint: `${property.address_line_1} · ${Number(rent.bedrooms) === 0 ? "studio" : `${rent.bedrooms} bed`}`,
      published_at: (rent.published_at as string) ?? null,
    });
  }
  return items.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "")).slice(0, 8);
}

function collectPlaces(
  rows: Array<{ city?: string | null; province?: string | null; review_count?: number; rent_report_count?: number }>,
  requirePublished: boolean,
) {
  const map = new Map<string, { city: string; province: string; count: number }>();
  for (const row of rows) {
    if (!row.city || !row.province) continue;
    if (requirePublished && (row.review_count ?? 0) < 1 && (row.rent_report_count ?? 0) < 1) continue;
    const key = `${row.city}|${row.province}`;
    const current = map.get(key);
    if (current) current.count += 1;
    else map.set(key, { city: String(row.city), province: String(row.province), count: 1 });
  }
  return [...map.values()].sort((a, b) => a.city.localeCompare(b.city));
}

const cachedCityPlaceRows = unstable_cache(
  async () => {
    const supabase = createPublicSupabase();
    if (!supabase) {
      return demoProperties.map((property) => ({
        city: property.city,
        province: property.province,
        review_count: property.review_count,
        rent_report_count: property.rent_report_count,
      }));
    }
    const { data } = await supabase.from("public_properties").select("city, province, review_count, rent_report_count");
    return data ?? [];
  },
  ["city-place-rows-v1"],
  { revalidate: 60, tags: [LISTINGS_TAG] },
);

export async function listCityPlaces(requirePublished = false) {
  return collectPlaces(await cachedCityPlaceRows(), requirePublished);
}

export async function listIndexablePlaces() {
  return listCityPlaces(true);
}

export const resolveCityPlace = cache(async function resolveCityPlace(provinceSlug: string, cityPath: string) {
  const province = provinceSlug.trim().toUpperCase();
  const slug = placeSlug(cityPath);
  const places = await listCityPlaces(true);
  return places.find((place) => place.province === province && placeSlug(place.city) === slug) ?? null;
});

async function matchesForSearch(
  search: SavedSearch,
): Promise<Property[]> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return demoProperties.filter((property) => {
      if (property.city !== search.city || property.province !== search.province) return false;
      if (search.property_type && property.property_type !== search.property_type) return false;
      const changed = property.last_review_date ?? property.created_at;
      return changed >= search.created_at;
    });
  }
  let query = supabase
    .from("public_properties")
    .select("*")
    .eq("city", search.city)
    .eq("province", search.province);
  if (search.property_type) query = query.eq("property_type", search.property_type);
  const { data } = await query
    .or(`created_at.gte.${search.created_at},last_review_date.gte.${search.created_at}`)
    .order("last_review_date", { ascending: false, nullsFirst: false })
    .limit(6);
  return ((data ?? []) as Record<string, unknown>[]).map(mapPropertyLite);
}

export async function loadTodayData(input: {
  userId: string;
  displayName: string | null;
}): Promise<TodayData> {
  const empty: TodayData = {
    configured: false,
    heading: todayLabel(),
    unread: [],
    home: null,
    saved: [],
    lease: null,
    rentThisMonth: null,
    notes: [],
    searches: [],
    checklistProperty: null,
    completedSteps: [],
    pulse: [],
    city: null,
    province: null,
  };
  const supabase = await createServerSupabase();
  if (!supabase) return empty;

  const { year, month } = currentYearMonth();
  const [
    unread,
    saved,
    home,
    { data: profile },
    { data: leaseRow },
    { data: rentRow },
    { data: noteRows },
    { data: searchRows },
    { data: checklistRows },
  ] = await Promise.all([
    getNotifications(input.userId, 8).then((rows) => rows.filter((row) => !row.read_at)),
    getSavedProperties(input.userId),
    getHomeProperty(input.userId),
    supabase.from("profiles").select("home_city, home_province").eq("id", input.userId).maybeSingle(),
    supabase
      .from("lease_dates")
      .select("lease_end, notice_date, property_id")
      .eq("user_id", input.userId)
      .maybeSingle(),
    supabase
      .from("rent_logs")
      .select("id, year, month, amount, paid_on")
      .eq("user_id", input.userId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("home_notes")
      .select("id, topic, body, created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("saved_searches")
      .select("id, city, province, property_type, created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("move_checklist")
      .select("property_id, completed_steps")
      .eq("user_id", input.userId)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const city = home?.city ?? profile?.home_city ?? null;
  const province = home?.province ?? profile?.home_province ?? null;
  const searches = ((searchRows ?? []) as SavedSearch[]).map((search) => ({
    ...search,
    property_type: (search.property_type as PropertyType | null) ?? null,
  }));
  const searchMatches: SavedSearchMatch[] = await Promise.all(
    searches.map(async (search) => ({ search, buildings: await matchesForSearch(search) })),
  );

  const checklistRow = checklistRows?.[0];
  const checklistProperty =
    saved.find((property) => property.id === checklistRow?.property_id) ??
    home ??
    saved[0] ??
    null;
  const completedSteps = ((checklistRow?.completed_steps ?? []) as string[]).filter((step): step is MoveChecklistStep =>
    MOVE_CHECKLIST_STEPS.some((item) => item.key === step),
  );

  return {
    configured: true,
    heading: todayLabel(),
    unread,
    home,
    saved,
    lease: (leaseRow as LeaseDates | null) ?? null,
    rentThisMonth: rentRow
      ? {
          id: String(rentRow.id),
          year: Number(rentRow.year),
          month: Number(rentRow.month),
          amount: Number(rentRow.amount),
          paid_on: (rentRow.paid_on as string) ?? null,
        }
      : null,
    notes: ((noteRows ?? []) as HomeNote[]).map((note) => ({
      ...note,
      topic: note.topic as HomeNoteTopic,
    })),
    searches: searchMatches,
    checklistProperty,
    completedSteps,
    pulse: city && province ? await getCityPulse(city, province) : [],
    city,
    province,
  };
}

export { cityCanonicalPath, formatDate };
