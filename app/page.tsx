import { HomeDossier } from "@/components/home-dossier";
import { JsonLd } from "@/components/json-ld";
import { listingHref } from "@/components/listing-ui";
import { listingFiltersFrom, loadListingMarketplace } from "@/lib/listings/page-data";
import { hasSupabaseConfig } from "@/lib/env";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  exploreCityRedirectPath,
  faqJsonLd,
  pageMetadata,
  websiteJsonLd,
} from "@/lib/seo";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata(`${SITE_NAME} — ${SITE_TAGLINE}`, SITE_DESCRIPTION, "/"),
  title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE}` },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = listingFiltersFrom(params);
  const cityPath = exploreCityRedirectPath(filters);
  if (cityPath) redirect(cityPath);
  if (filters.city || filters.province || filters.propertyType || filters.hasReviews || filters.hasRent) {
    redirect(listingHref("/explore", filters, {}));
  }
  const data = await loadListingMarketplace(params);
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={faqJsonLd()} />
      <HomeDossier
        filters={data.filters}
        facets={data.facets}
        listings={data.listings}
        token={data.token}
        databaseReady={hasSupabaseConfig()}
      />
    </>
  );
}
