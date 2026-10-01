import Link from "next/link";
import { AddressSearch } from "@/components/address-search";
import { ListingProvinceSelect } from "@/components/listing-province-select";
import { UnknownAddressContribute } from "@/components/unknown-address-contribute";
import {
  ListingFilters,
  SearchDossierCard,
  propertyHref,
  type ListingCardModel,
  type ListingFacets,
  type ListingFiltersState,
} from "@/components/listing-ui";
import { PropertyMap } from "@/components/maps/property-map";

export function SearchDossier({
  filters,
  facets,
  listings,
  token,
}: {
  filters: ListingFiltersState;
  facets: ListingFacets;
  listings: ListingCardModel[];
  token: string | null;
}) {
  const pins = listings
    .filter((row) => row.property.latitude != null && row.property.longitude != null)
    .map((row) => ({
      id: row.property.id,
      latitude: row.property.latitude,
      longitude: row.property.longitude,
      label: row.property.address_line_1,
      sublabel: `${row.property.city}, ${row.property.province}`,
      href: propertyHref(row.property),
      rating: row.rating,
    }));

  return (
    <div className="w-full">
      <section className="bg-surface border border-rule">
        <div className="dossier-wrap py-4">
          <div className="mb-4 flex flex-col gap-2.5 md:flex-row">
            <div className="min-w-0 flex-1">
              <AddressSearch
                defaultValue={filters.q}
                size="md"
                mapToken={token}
                city={filters.city}
                province={filters.province}
              />
            </div>
            <ListingProvinceSelect
              action="/search"
              province={filters.province}
              q={filters.q}
              city={filters.city}
            />
          </div>
          <ListingFilters action="/search" filters={filters} facets={facets} />
          <p className="mt-4 text-sm text-mute">
            <span className="font-semibold text-ink">
              Showing {listings.length} {listings.length === 1 ? "building" : "buildings"}
            </span>
            {filters.province ? ` in ${filters.province}` : ""}
            {filters.city ? ` in ${filters.city}` : ""}
            {filters.q ? ` for “${filters.q}”` : ""}
          </p>
        </div>
      </section>

      <div className="dossier-wrap py-4">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            {listings.length === 0 ? (
              filters.q ? (
                <UnknownAddressContribute
                  query={filters.q}
                  mapToken={token}
                  province={filters.province}
                  city={filters.city}
                />
              ) : (
                <p className="rounded-md bg-surface p-6 text-sm text-mute border border-rule">
                  No buildings on file match that filter.{" "}
                  <Link className="font-semibold text-accent hover:text-accent-hover" href="/rate">
                    Write a review
                  </Link>
                </p>
              )
            ) : (
              listings.map((row) => <SearchDossierCard key={row.property.id} row={row} />)
            )}
          </div>
          {pins.length > 0 ? (
            <aside className="lg:sticky lg:top-20 lg:col-span-5">
              <div className="overflow-hidden rounded-md bg-surface border border-rule">
                <PropertyMap pins={pins} token={token} className="h-[380px] border-0" />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
