import Link from "next/link";
import { ArrowRight, GitCompare, PenLine, Receipt } from "lucide-react";
import { AddressSearch } from "@/components/address-search";
import { ListingProvinceSelect } from "@/components/listing-province-select";
import {
  DossierCard,
  listingHref,
  type ListingCardModel,
  type ListingFacets,
  type ListingFiltersState,
} from "@/components/listing-ui";
import { HOME_FAQS } from "@/lib/seo";

export function HomeDossier({
  filters,
  facets,
  listings,
  token,
  databaseReady,
}: {
  filters: ListingFiltersState;
  facets: ListingFacets;
  listings: ListingCardModel[];
  token: string | null;
  databaseReady: boolean;
}) {
  const recent = [...listings]
    .sort((a, b) => (b.property.last_review_date ?? "").localeCompare(a.property.last_review_date ?? ""))
    .slice(0, 3);

  return (
    <div className="w-full">
      <section className="flex min-h-[calc(100svh-4rem)] flex-col justify-center bg-paper py-10 md:py-14">
        <div className="dossier-wrap flex flex-1 flex-col justify-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-mute">Look up any Canadian address.</p>
            <h1 className="display mt-3 text-4xl text-ink sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              Know before you move to your new home.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">
              Read renter-reported reviews, ratings, and what people paid — before you sign. If the building isn&apos;t
              on file yet, be the first to rate it.
            </p>
          </div>

          <div className="relative z-30 mt-8 max-w-4xl rounded-md bg-surface p-2.5 border border-rule sm:p-3">
            <div className="flex flex-col items-stretch gap-2.5 md:flex-row">
              <div className="min-w-0 flex-1">
                <AddressSearch
                  defaultValue={filters.q}
                  size="lg"
                  mapToken={token}
                  city={filters.city}
                  province={filters.province}
                />
              </div>
              <ListingProvinceSelect action="/explore" province={filters.province} q={filters.q} city={filters.city} />
            </div>
          </div>

          <dl className="mt-8 grid max-w-4xl grid-cols-1 gap-2 rounded-md border border-rule bg-surface p-2 sm:grid-cols-3">
            <div className="rounded-md bg-muted px-3 py-3">
              <dt className="text-xs font-medium text-mute">Reviews</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">From people who lived there</dd>
            </div>
            <div className="rounded-md bg-muted px-3 py-3">
              <dt className="text-xs font-medium text-mute">Reported rent</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">What renters say they paid</dd>
            </div>
            <div className="rounded-md bg-muted px-3 py-3">
              <dt className="text-xs font-medium text-mute">Compare</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                <Link href="/compare" className="hover:text-accent">
                  Buildings side by side
                </Link>
              </dd>
            </div>
          </dl>

          {facets.cityPlaces.length > 0 ? (
            <nav className="mt-4 flex max-w-4xl flex-wrap items-center gap-2" aria-label="Cities">
              {facets.cityPlaces.map((place) => (
                <Link
                  key={`${place.city}-${place.province}`}
                  href={listingHref("/explore", filters, { city: place.city, province: place.province })}
                  className="inline-flex min-h-11 items-center rounded-md border border-rule bg-muted px-3 text-sm font-semibold text-mute hover:border-ink hover:text-ink"
                >
                  {place.city}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/rate"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-paper hover:bg-accent-hover"
            >
              <PenLine className="size-4" aria-hidden />
              Write a review
            </Link>
            <Link
              href="/rate?intent=rent"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-rule bg-surface px-5 text-sm font-semibold text-ink hover:bg-muted"
            >
              <Receipt className="size-4" aria-hidden />
              Report your rent
            </Link>
            <Link
              href="/compare"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-surface px-5 text-sm font-semibold text-ink border border-rule hover:bg-muted"
            >
              <GitCompare className="size-4" aria-hidden />
              Compare buildings
            </Link>
          </div>

          {facets.buildingCount > 0 ? (
            <p className="mt-8 text-sm text-mute">
              <span className="figure text-base font-bold text-ink">{facets.buildingCount}</span>{" "}
              {facets.buildingCount === 1 ? "building" : "buildings"} on file
              {facets.reviewCount > 0 ? (
                <>
                  {" "}
                  · <span className="figure font-semibold text-ink">{facets.reviewCount}</span>{" "}
                  {facets.reviewCount === 1 ? "review" : "reviews"}
                </>
              ) : null}
              {facets.rentReportCount > 0 ? (
                <>
                  {" "}
                  · <span className="figure font-semibold text-ink">{facets.rentReportCount}</span> rent{" "}
                  {facets.rentReportCount === 1 ? "report" : "reports"}
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="dossier-wrap mt-8">
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-mute hover:text-ink"
          >
            See buildings on file
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section id="recently-reviewed" className="scroll-mt-20 py-16 md:py-24">
        <div className="dossier-wrap">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-ink">Recently reviewed buildings</h2>
              <p className="mt-1 text-sm text-mute">Buildings on file, ordered by the latest published review.</p>
            </div>
            <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover">
              View all {facets.buildingCount} {facets.buildingCount === 1 ? "building" : "buildings"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-mute">
              {databaseReady ? (
                <>
                  No buildings on file yet.{" "}
                  <Link className="font-semibold text-accent hover:text-accent-hover" href="/rate">
                    Write a review
                  </Link>
                </>
              ) : (
                "Building records aren’t loading on this deploy. Set the livrank Supabase env vars and trigger a new production deploy."
              )}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
              {recent.map((row) => (
                <DossierCard key={row.property.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>

      {facets.cities.length > 0 ? (
        <section className="bg-muted py-16 md:py-24">
          <div className="dossier-wrap">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-ink">Explore by city</h2>
              <p className="mt-1.5 text-sm text-mute">Open the buildings on file in each city.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(facets.cityPlaces.length ? facets.cityPlaces : facets.cities.map((city) => ({ city, province: "", count: facets.cityCounts[city] ?? 0 }))).map(
                (place) => (
                  <Link
                    key={`${place.city}-${place.province}`}
                    href={listingHref("/explore", filters, { city: place.city, province: place.province || filters.province })}
                    className="flex flex-col justify-between rounded-md bg-surface p-6 border border-rule hover:text-accent"
                  >
                    <h3 className="text-xl font-semibold text-ink">{place.city}</h3>
                    <p className="mt-6 text-sm text-mute">
                      <span className="figure font-semibold text-ink">{place.count}</span>{" "}
                      {place.count === 1 ? "building" : "buildings"}
                    </p>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-paper py-16 md:py-24" aria-labelledby="before-you-move">
        <div className="dossier-wrap">
          <div className="max-w-3xl">
            <h2 id="before-you-move" className="text-3xl font-bold tracking-tight text-ink">
              Before you move
            </h2>
            <p className="mt-2 text-sm text-mute">Plain answers. No official registry, no invented buildings.</p>
            <dl className="mt-8 space-y-8">
              {HOME_FAQS.map((faq) => (
                <div key={faq.question}>
                  <dt className="text-lg font-semibold text-ink">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-7 text-mute">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-paper pb-16">
        <div className="dossier-wrap">
          <div className="rounded-md border border-rule bg-surface px-8 py-10 text-ink md:px-14 md:py-14">
            <h2 className="display text-3xl md:text-5xl">Lived there? Add it to the file.</h2>
            <p className="mt-4 max-w-xl text-base text-mute">
              Write a review or report the rent you paid. Search stays free for the next renter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/rate"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-paper hover:bg-accent-hover"
              >
                <PenLine className="size-4" aria-hidden />
                Write a review
              </Link>
              <Link
                href="/rate?intent=rent"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-rule bg-paper px-5 text-sm font-semibold text-ink hover:bg-muted"
              >
                <Receipt className="size-4" aria-hidden />
                Report your rent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
