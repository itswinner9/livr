import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExploreDossier } from "@/components/explore-dossier";
import { JsonLd } from "@/components/json-ld";
import { listingHref } from "@/components/listing-ui";
import { listingFiltersFrom, loadListingMarketplace } from "@/lib/listings/page-data";
import {
  breadcrumbJsonLd,
  exploreCanonicalPath,
  exploreDescription,
  exploreHeading,
  exploreTitle,
  pageMetadata,
} from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filters = listingFiltersFrom(params);
  const data = await loadListingMarketplace(params, { limit: 48 });
  const path = exploreCanonicalPath(filters);
  return pageMetadata(exploreTitle(filters), exploreDescription(filters, data.listings.length), path);
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = listingFiltersFrom(params);
  if (filters.q) {
    redirect(listingHref("/search", filters, {}));
  }
  const data = await loadListingMarketplace(params, { limit: 48 });
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: exploreHeading(filters), path: exploreCanonicalPath(filters) },
        ])}
      />
      <ExploreDossier filters={data.filters} facets={data.facets} listings={data.listings} />
    </>
  );
}
