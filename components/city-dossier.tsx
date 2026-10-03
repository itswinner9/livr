import Link from "next/link";
import { DossierCard, type ListingCardModel, type ListingFacets } from "@/components/listing-ui";
import { SavedSearchForm } from "@/components/today-forms";
import { cityCanonicalPath, cityFaqs, exploreHeading, provinceExplorePath, provinceLabel } from "@/lib/seo";

export function CityDossier({
  city,
  province,
  listings,
  loggedIn,
}: {
  city: string;
  province: string;
  listings: ListingCardModel[];
  facets?: ListingFacets;
  loggedIn: boolean;
}) {
  const faqs = cityFaqs(city, province);
  return (
    <div className="w-full">
      <section className="border-b border-rule bg-paper py-10 md:py-14">
        <div className="dossier-wrap">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-mute">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href={provinceExplorePath(province)} className="hover:text-accent">
              {provinceLabel(province)}
            </Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-ink">{city}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold text-ink md:text-4xl">
            {exploreHeading({ city, province })}
          </h1>
          <p className="mt-3 max-w-xl text-base text-mute">
            Know before you move. Renter-reported reviews and rent in {city}, {province} — not official records.
          </p>
          {loggedIn ? (
            <div className="mt-6 max-w-xl rounded-md border border-rule bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Watch this city</p>
              <p className="mt-1 text-sm text-mute">New buildings and reviews will show on Today.</p>
              <SavedSearchForm city={city} province={province} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-mute">
              <Link href={`/login?next=${encodeURIComponent(cityCanonicalPath({ city, province }))}`} className="font-semibold text-accent hover:text-accent-hover">
                Log in
              </Link>{" "}
              to watch this city on Today.
            </p>
          )}
        </div>
      </section>

      <section className="bg-muted py-10 md:py-14">
        <div className="dossier-wrap">
          {listings.length === 0 ? (
            <p className="text-sm text-mute">
              No published buildings in {city} yet.{" "}
              <Link href="/rate" className="font-semibold text-accent hover:text-accent-hover">
                Be the first to write a review
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((row) => (
                <DossierCard key={row.property.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-paper py-16" aria-labelledby="city-faqs">
        <div className="dossier-wrap max-w-3xl">
          <h2 id="city-faqs" className="text-3xl font-bold tracking-tight text-ink">
            Before you move to {city}
          </h2>
          <dl className="mt-8 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-lg font-semibold text-ink">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-7 text-mute">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
