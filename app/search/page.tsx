import type { Metadata } from "next";
import { SearchDossier } from "@/components/search-dossier";
import { listingFiltersFrom, loadListingMarketplace } from "@/lib/listings/page-data";
import { noIndexFollow, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filters = listingFiltersFrom(params);
  if (filters.q) {
    return {
      ...pageMetadata(
        `Search results for “${filters.q}”`,
        `Renter-reported building files matching “${filters.q}”.`,
        "/search",
      ),
      ...noIndexFollow(),
    };
  }
  return pageMetadata(
    "Search rental buildings in Canada",
    "Know before you move. Look up a Canadian address and open the renter-reported building file before you sign. LivRank does not claim official rental history.",
    "/search",
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await loadListingMarketplace(await searchParams);
  return (
    <SearchDossier filters={data.filters} facets={data.facets} listings={data.listings} token={data.token} />
  );
}
