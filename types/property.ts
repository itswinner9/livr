import type { PropertyStatus } from "./database";
export { PROVINCES, type ProvinceCode } from "./database";

export const PROPERTY_TYPES = [
  "apartment",
  "condo",
  "house",
  "townhouse",
  "basement",
  "duplex",
  "triplex",
  "fourplex",
  "student_housing",
  "other",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment building",
  condo: "Condo",
  house: "House",
  townhouse: "Townhouse",
  basement: "Basement suite",
  duplex: "Duplex",
  triplex: "Triplex",
  fourplex: "Fourplex",
  student_housing: "Student housing",
  other: "Other",
};

/** Columns exposed through the `public_properties` view. No creator IDs. */
export interface PublicProperty {
  id: string;
  slug: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  country: string;
  building_name: string | null;
  property_type: PropertyType | null;
  year_built: number | null;
  units_count: number | null;
  latitude: number | null;
  longitude: number | null;
  normalized_address: string;
  review_count: number;
  rent_report_count: number;
  avg_overall_rating: number | null;
  last_review_date: string | null;
  last_rent_report_date: string | null;
  has_manager: boolean;
  has_ai_summary: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminProperty extends PublicProperty {
  status: PropertyStatus;
  created_by: string | null;
  merged_into_id: string | null;
  provider_place_id: string | null;
  normalized_city: string;
  normalized_postal_code: string | null;
  data_completeness: number;
}

export const PUBLIC_PROPERTY_COLUMNS =
  "id, slug, address_line_1, address_line_2, city, province, postal_code, country, building_name, property_type, year_built, units_count, latitude, longitude, normalized_address, review_count, rent_report_count, avg_overall_rating, last_review_date, last_rent_report_date, has_manager, has_ai_summary, is_demo, created_at, updated_at";

export type Property = PublicProperty & { merged_into_id?: string | null };

export type RatingSummary = {
  overall: number | null;
  maintenance: number | null;
  management: number | null;
  noise: number | null;
  cleanliness: number | null;
  building_condition: number | null;
  parking: number | null;
  value: number | null;
  reviewCount: number;
};

export type IssueMention = { topic: string; mentions: number };

export type RentHistoryGroup = {
  bedrooms: number;
  years: {
    year: number;
    rents: number[];
    median: number | null;
    min: number | null;
    max: number | null;
    count: number;
  }[];
};

export function completeProperty(
  row: Partial<Property> & Pick<Property, "id" | "address_line_1" | "city" | "province" | "created_at">,
): Property {
  return {
    slug: row.slug ?? null,
    address_line_2: row.address_line_2 ?? null,
    postal_code: row.postal_code ?? null,
    country: row.country ?? "Canada",
    building_name: row.building_name ?? null,
    property_type: row.property_type ?? null,
    year_built: row.year_built ?? null,
    units_count: row.units_count ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    normalized_address: row.normalized_address ?? "",
    review_count: row.review_count ?? 0,
    rent_report_count: row.rent_report_count ?? 0,
    avg_overall_rating: row.avg_overall_rating ?? null,
    last_review_date: row.last_review_date ?? null,
    last_rent_report_date: row.last_rent_report_date ?? null,
    has_manager: row.has_manager ?? false,
    has_ai_summary: row.has_ai_summary ?? false,
    is_demo: row.is_demo ?? false,
    updated_at: row.updated_at ?? row.created_at,
    merged_into_id: row.merged_into_id ?? null,
    ...row,
  };
}
