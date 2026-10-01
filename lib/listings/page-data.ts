import { mapboxToken } from "@/lib/address/provider";
import { normalizeProvince } from "@/lib/address/normalize";
import {
  browseListings,
  getPropertyRentHistory,
  listListingFacets,
  searchProperties,
  type ListingFilters,
} from "@/lib/properties/queries";
import { latestReportedRent } from "@/lib/rent-reports/latest";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import type { ListingCardModel, ListingFiltersState } from "@/components/listing-ui";

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

export async function loadListingMarketplace(
  searchParams: Record<string, string | string[] | undefined>,
  options: { limit?: number } = {},
) {
  const filters = listingFiltersFrom(searchParams);
  const queryFilters: ListingFilters = {
    city: filters.city || undefined,
    province: filters.province || undefined,
    propertyType: filters.propertyType || undefined,
    hasReviews: filters.hasReviews,
    hasRent: filters.hasRent,
  };
  const [rows, facets] = await Promise.all([
    filters.q ? searchProperties(filters.q, queryFilters) : browseListings(queryFilters, options.limit),
    listListingFacets(),
  ]);
  const listings: ListingCardModel[] = await Promise.all(
    rows.map(async (property) => {
      const rentGroups = await getPropertyRentHistory(property.id);
      return {
        property,
        rating:
          property.review_count >= MIN_REVIEWS_FOR_RATING && property.avg_overall_rating != null
            ? property.avg_overall_rating
            : null,
        rent: latestReportedRent(rentGroups),
      };
    }),
  );
  return {
    filters,
    facets,
    listings,
    token: mapboxToken(),
  };
}
