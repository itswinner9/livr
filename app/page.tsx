import { HomeDossier } from "@/components/home-dossier";
import { JsonLd } from "@/components/json-ld";
import { listingHref } from "@/components/listing-ui";
import { listingFiltersFrom, loadListingMarketplace } from "@/lib/listings/page-data";
import { SITE_NAME, SITE_TAGLINE, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata(
    `${SITE_NAME} — ${SITE_TAGLINE}`,
    "Look up any Canadian address. If it is already on file, read the renter-reported reviews and rent. If it is not, be the first to rate it.",
    "/",
  ),
  title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE}` },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = listingFiltersFrom(params);
  if (filters.city || filters.province || filters.propertyType || filters.hasReviews || filters.hasRent) {
    redirect(listingHref("/explore", filters, {}));
  }
  const data = await loadListingMarketplace(params);
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <HomeDossier filters={data.filters} facets={data.facets} listings={data.listings} token={data.token} />
    </>
  );
}
