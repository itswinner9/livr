import { cache } from "react";
import { mapboxToken } from "@/lib/address/provider";
import { normalizeProvince } from "@/lib/address/normalize";
import { demoProperties } from "@/lib/demo/data";
import { demoRentHistory } from "@/lib/demo/data";
import {
  browseListings,
  getLatestRentsForProperties,
  listListingFacets,
  searchProperties,
  type ListingFilters,
} from "@/lib/properties/queries";
import { latestReportedRent } from "@/lib/rent-reports/latest";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import type { ListingCardModel, ListingFacets, ListingFiltersState } from "@/components/listing-ui";

function first(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function listingFiltersFrom(searchParams: Record<string, string | string[] | undefined>): ListingFiltersState {
  return {
    q: first(searchParams.q),
    city: first(searchParams.city),
    province: normalizeProvince(first(searchParams.province)) ?? "",
    propertyType: first(searchParams.type),
    hasReviews: first(searchParams.reviews) === "1",
    hasRent: first(searchParams.rent) === "1",
  };
}

function marketplaceCacheKey(
  searchParams: Record<string, string | string[] | undefined>,
  options: { limit?: number } = {},
) {
  const filters = listingFiltersFrom(searchParams);
  return JSON.stringify({
    q: filters.q,
    city: filters.city,
    province: filters.province,
    propertyType: filters.propertyType,
    hasReviews: filters.hasReviews,
    hasRent: filters.hasRent,
    limit: options.limit ?? 24,
  });
}

const loadListingMarketplaceCached = cache(async (key: string) => {
  const parsed = JSON.parse(key) as ListingFiltersState & { limit: number };
  const filters: ListingFiltersState = {
    q: parsed.q,
    city: parsed.city,
    province: parsed.province,
    propertyType: parsed.propertyType,
    hasReviews: parsed.hasReviews,
    hasRent: parsed.hasRent,
  };
  const queryFilters: ListingFilters = {
    city: filters.city || undefined,
    province: filters.province || undefined,
    propertyType: filters.propertyType || undefined,
    hasReviews: filters.hasReviews,
    hasRent: filters.hasRent,
  };
  const [rows, facets] = await Promise.all([
    filters.q ? searchProperties(filters.q, queryFilters) : browseListings(queryFilters, parsed.limit),
    listListingFacets(),
  ]);
  const rents = await getLatestRentsForProperties(rows.map((property) => property.id));
  const listings: ListingCardModel[] = rows.map((property) => ({
    property,
    rating:
      property.review_count >= MIN_REVIEWS_FOR_RATING && property.avg_overall_rating != null
        ? property.avg_overall_rating
        : null,
    rent: rents[property.id] ?? null,
  }));
  return {
    filters,
    facets,
    listings,
    token: mapboxToken(),
  };
});

export function loadListingMarketplace(
  searchParams: Record<string, string | string[] | undefined>,
  options: { limit?: number } = {},
) {
  return loadListingMarketplaceCached(marketplaceCacheKey(searchParams, options));
}

export function cityBuildingCount(
  facets: Pick<ListingFacets, "cityPlaces">,
  city: string,
  province: string,
) {
  return facets.cityPlaces.find((place) => place.city === city && place.province === province)?.count ?? 0;
}

export async function loadCityMarketplace(city: string, province: string) {
  const params = { city, province };
  const data = await loadListingMarketplace(params, { limit: 48 });
  if (data.listings.length > 0) return data;
  const listings: ListingCardModel[] = demoProperties
    .filter((property) => property.city === city && property.province === province)
    .map((property) => ({
      property,
      rating:
        property.review_count >= MIN_REVIEWS_FOR_RATING && property.avg_overall_rating != null
          ? property.avg_overall_rating
          : null,
      rent: latestReportedRent(demoRentHistory(property.id)),
    }));
  return { ...data, listings };
}
