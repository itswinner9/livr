import Link from "next/link";
import { ListingProvinceSelect } from "@/components/listing-province-select";
import {
  DossierCard,
  ListingFilters,
  listingHref,
  type ListingCardModel,
  type ListingFacets,
  type ListingFiltersState,
} from "@/components/listing-ui";
import { cityCanonicalPath } from "@/lib/seo";

export function ExploreDossier({
  filters,
  facets,
  listings,
}: {
  filters: ListingFiltersState;
  facets: ListingFacets;
  listings: ListingCardModel[];
}) {
  return (
    <div className="w-full">
      <section className="border-b border-rule bg-paper py-10 md:py-14">
        <div className="dossier-wrap">
          <h1 className="text-3xl font-semibold text-ink md:text-4xl">
            {filters.city && filters.province
              ? `Buildings on file in ${filters.city}, ${filters.province}`
              : filters.city
                ? `Buildings on file in ${filters.city}`
                : filters.province
                  ? `Buildings on file in ${filters.province}`
                  : "Buildings on file"}
          </h1>
          <p className="mt-3 max-w-xl text-base text-mute">
            {filters.city
              ? `Know before you move. Renter-reported reviews and rent in ${filters.city}, not official records.`
              : "Know before you move. Browse by city, then open a file. Ratings and rent figures are published renter reports, not official records."}
          </p>
          <div className="mt-6 max-w-xs">
            <ListingProvinceSelect
              action="/explore"
              province={filters.province}
              city={filters.city}
            />
          </div>
        </div>
      </section>

      {facets.cities.length > 0 ? (
        <section className="bg-muted py-10 md:py-14">
          <div className="dossier-wrap">
            <h2 className="text-sm font-semibold text-ink">Cities</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(facets.cityPlaces.length ? facets.cityPlaces : facets.cities.map((city) => ({ city, province: "", count: facets.cityCounts[city] ?? 0 }))).map(
                (place) => {
                  const count = place.count;
                  const active = filters.city === place.city && (!place.province || filters.province === place.province);
                  return (
                    <Link
                      key={`${place.city}-${place.province}`}
                      href={
                        active
                          ? "/explore"
                          : place.province
                            ? cityCanonicalPath(place)
                            : listingHref("/explore", filters, {
                                city: place.city,
                                province: filters.province,
                              })
                      }
                      className={`flex flex-col justify-between rounded-md border p-5 ${
                        active ? "border-ink bg-surface" : "border-rule bg-surface hover:border-ink"
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-ink">
                        {place.city}
                        {place.province ? <span className="ml-2 text-sm font-medium text-mute">{place.province}</span> : null}
                      </h3>
                      <p className="mt-4 text-sm text-mute">
                        <span className="figure font-semibold text-ink">{count}</span>{" "}
                        {count === 1 ? "building" : "buildings"}
                      </p>
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-10 md:py-14">
        <div className="dossier-wrap">
          <ListingFilters action="/explore" filters={filters} facets={facets} />
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-ink">
              {listings.length} {listings.length === 1 ? "building" : "buildings"}
              {filters.city ? ` in ${filters.city}` : ""}
              {filters.province && !filters.city ? ` in ${filters.province}` : ""}
            </h2>
            <Link href="/search" className="text-sm font-semibold text-accent hover:text-accent-hover">
              Search by address
            </Link>
          </div>
          {listings.length === 0 ? (
            <p className="mt-6 text-sm text-mute">
              No buildings on file match that filter.{" "}
              <Link className="font-semibold text-accent hover:text-accent-hover" href="/rate">
                Write a review
              </Link>
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((row) => (
                <DossierCard key={row.property.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
