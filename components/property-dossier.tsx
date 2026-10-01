import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, PenLine, Receipt } from "lucide-react";
import { AskLivRank } from "@/components/ask-livrank";
import { BuildingHistory } from "@/components/building-history";
import { CompareToggle } from "@/components/compare-toggle";
import { EmptyState } from "@/components/empty-state";
import { PropertyIssues } from "@/components/property-issues";
import { PropertySectionNav, type PropertySection } from "@/components/property-section-nav";
import { RatingBreakdown } from "@/components/rating-breakdown";
import { RentHistory } from "@/components/rent-history";
import { ReviewCard } from "@/components/review-card";
import { SavedButton } from "@/components/saved-property-button";
import { PropertyMap } from "@/components/maps/property-map";
import { Stars } from "@/components/stars";
import { itemFromProperty } from "@/lib/compare/ids";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import { verbatimReviewQuotes } from "@/lib/reviews/quotes";
import { formatCad, formatDate, cn } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, type IssueMention, type Property, type RatingSummary, type RentHistoryGroup } from "@/types/property";
import type { OwnPendingReply, PublicReviewReply, Review } from "@/types/review";
import type { PublicPropertyUnit } from "@/lib/properties/queries";

function latestReportedRent(groups: RentHistoryGroup[]) {
  let best: { year: number; amount: number; bedrooms: number } | null = null;
  for (const group of groups) {
    for (const year of group.years) {
      const amount = year.median ?? year.rents[0];
      if (amount == null) continue;
      if (!best || year.year > best.year) {
        best = { year: year.year, amount, bedrooms: group.bedrooms };
      }
    }
  }
  return best;
}

function HeroMetric({
  label,
  value,
  hint,
  href,
  valueAriaLabel,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  valueAriaLabel?: string;
  className?: string;
}) {
  const valueClass = cn(
    "mt-1 block text-3xl font-extrabold leading-none tracking-tight text-ink tabular-nums",
    href && "hover:text-accent",
  );
  return (
    <div className={cn("rounded-md bg-muted px-3 py-3", className)}>
      <dt className="text-xs font-medium text-mute">{label}</dt>
      <dd>
        {href ? (
          <a href={href} className={valueClass} aria-label={valueAriaLabel}>
            {value}
          </a>
        ) : (
          <div className={valueClass}>{value}</div>
        )}
        {hint ? <div className="mt-2 text-sm text-mute">{hint}</div> : null}
      </dd>
    </div>
  );
}

export function PropertyDossier({
  property,
  ratingSummary,
  rentSummary,
  issues,
  aiSummary,
  reviews,
  sort,
  units,
  nearby,
  token,
  repliesByReview,
  pendingByReview,
  loggedIn,
}: {
  property: Property;
  ratingSummary: RatingSummary;
  rentSummary: RentHistoryGroup[];
  issues: IssueMention[];
  aiSummary: { summary_text: string } | null;
  reviews: Review[];
  sort?: string;
  units: PublicPropertyUnit[];
  nearby: Property[];
  token: string | null;
  repliesByReview: Map<string, PublicReviewReply[]>;
  pendingByReview: Map<string, OwnPendingReply[]>;
  loggedIn: boolean;
}) {
  const typeLabel = property.property_type ? PROPERTY_TYPE_LABELS[property.property_type] : null;
  const heading = property.building_name?.replace(/\s*\(Demo\)\s*/gi, "").trim() || property.address_line_1;
  const propertyHref = `/property/${property.slug || property.id}`;
  const latestRent = latestReportedRent(rentSummary);
  const quotes = verbatimReviewQuotes(reviews);
  const hasAiSummary = Boolean(aiSummary?.summary_text && !aiSummary.summary_text.includes("Not enough"));
  const signalCopy = hasAiSummary
    ? aiSummary!.summary_text
    : "Renters have not left a summary yet. Read the reviews.";
  const hasTopics = issues.length > 0;
  const hasSignals = hasAiSummary || hasTopics;
  const hasMap = property.latitude != null && property.longitude != null;
  const hasFacts = Boolean(property.year_built || property.units_count);
  const hasRatings = ratingSummary.reviewCount > 0;
  const quote = quotes[0] ?? null;
  const sections: PropertySection[] = [
    { id: "overview", label: "Overview" },
    ...(hasRatings ? [{ id: "ratings", label: "Ratings" }] : []),
    { id: "signals", label: "Signals" },
    { id: "rent", label: "Rent" },
    { id: "reviews", label: `Reviews (${ratingSummary.reviewCount})` },
    { id: "history", label: "History" },
    { id: "ask", label: "Ask" },
  ];

  return (
    <div className="w-full">
      <section className="bg-surface">
        <div className="dossier-wrap py-3">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-mute">
            <Link href="/explore" className="hover:text-accent">
              Explore
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/explore?city=${encodeURIComponent(property.city)}`} className="hover:text-accent">
              {property.city}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="font-semibold text-ink">{heading}</span>
          </nav>
        </div>
      </section>

      <PropertySectionNav sections={sections} />

      <section id="overview" className="scroll-mt-32 bg-muted py-6 md:py-8">
        <div className="dossier-wrap grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="display text-3xl text-ink md:text-4xl">{heading}</h1>
            <p className="mt-2 text-sm text-mute">
              {[heading === property.address_line_1 ? null : property.address_line_1, property.city, property.province]
                .filter(Boolean)
                .join(", ")}
              {property.postal_code ? ` ${property.postal_code}` : ""}
              {typeLabel ? ` · ${typeLabel}` : ""}
            </p>
            {hasFacts ? (
              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {property.year_built ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mute">Year built</dt>
                    <dd className="font-semibold text-ink">{property.year_built}</dd>
                  </div>
                ) : null}
                {property.units_count ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mute">Units</dt>
                    <dd className="figure font-semibold text-ink">{property.units_count}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <dl
              aria-label="Building snapshot"
              className={`mt-5 grid gap-2 rounded-md border border-rule bg-surface p-2 ${latestRent ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
            >
              <HeroMetric
                label="Rating"
                value={
                  <>
                    {ratingSummary.overall != null ? ratingSummary.overall.toFixed(1) : "—"}
                    {ratingSummary.overall != null ? (
                      <span className="ml-1 text-sm font-medium text-mute">/ 5</span>
                    ) : null}
                  </>
                }
                hint={
                  ratingSummary.overall != null ? (
                    <Stars
                      value={ratingSummary.overall}
                      showValue={false}
                      label={`${ratingSummary.overall.toFixed(1)} out of 5 from renter reviews`}
                    />
                  ) : (
                    "No published rating yet"
                  )
                }
              />
              <HeroMetric
                label="Reviews"
                value={ratingSummary.reviewCount}
                href="#reviews"
                valueAriaLabel={`${ratingSummary.reviewCount} ${ratingSummary.reviewCount === 1 ? "review" : "reviews"}`}
                hint={
                  hasRatings ? (
                    <a href="#ratings" className="font-semibold text-accent hover:text-accent-hover">
                      Category ratings
                    </a>
                  ) : (
                    `${property.rent_report_count} rent ${property.rent_report_count === 1 ? "report" : "reports"}`
                  )
                }
              />
              {latestRent ? (
                <HeroMetric
                  className="col-span-2 sm:col-span-1"
                  label="Reported rent"
                  value={formatCad(latestRent.amount)}
                  href="#rent"
                  valueAriaLabel={`Reported rent ${formatCad(latestRent.amount)}`}
                  hint={`${latestRent.bedrooms === 0 ? "Studio" : `${latestRent.bedrooms} bedroom`} · ${latestRent.year}`}
                />
              ) : null}
            </dl>

            {quote ? (
              <blockquote className="mt-5 border-l-2 border-star pl-4">
                <p className="text-base leading-7 text-ink">“{quote}”</p>
                <a href="#reviews" className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-hover">
                  Read the reviews
                </a>
              </blockquote>
            ) : (
              <p className="mt-5 text-sm text-mute">
                <a href="#reviews" className="font-semibold text-accent hover:text-accent-hover">
                  Read the reviews
                </a>
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-paper hover:bg-accent-hover"
                href={`/review/new?propertyId=${property.id}`}
              >
                <PenLine className="size-4" aria-hidden />
                Write a review
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-semibold text-ink hover:bg-muted"
                href={`/rent-report/new?propertyId=${property.id}`}
              >
                <Receipt className="size-4" aria-hidden />
                Report rent
              </Link>
              <SavedButton propertyId={property.id} />
              <CompareToggle item={itemFromProperty(property)} idleLabel="Compare" selectedLabel="In compare" />
            </div>
          </div>

          {hasMap ? (
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-md border border-rule bg-surface">
                <div className="flex items-baseline justify-between gap-3 px-3 py-2">
                  <h2 className="text-sm font-semibold text-ink">Location</h2>
                  <a
                    className="text-sm font-semibold text-accent hover:text-accent-hover"
                    href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in maps
                  </a>
                </div>
                <PropertyMap
                  className="h-44 overflow-hidden md:h-72"
                  token={token}
                  pins={[
                    {
                      id: property.id,
                      latitude: property.latitude as number,
                      longitude: property.longitude as number,
                      label: `${property.address_line_1}, ${property.city}`,
                      rating: ratingSummary.overall,
                    },
                  ]}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-paper py-8">
        <div className="dossier-wrap grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-6">
            {hasRatings ? (
              <div id="ratings" className="scroll-mt-32 rounded-md border border-rule bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-xl font-bold text-ink">Ratings</h2>
                  <a href="#reviews" className="text-sm font-semibold text-accent hover:text-accent-hover">
                    See reviews
                  </a>
                </div>
                <div className="mt-4">
                  <RatingBreakdown summary={ratingSummary} />
                </div>
              </div>
            ) : null}
            {hasSignals ? (
              <div id="signals" className="scroll-mt-32 rounded-md border border-rule bg-surface p-5">
                <h2 className="text-xl font-bold text-ink">Renter signals</h2>
                <p className="mt-2 text-sm text-mute">{signalCopy}</p>
                {hasTopics ? (
                  <>
                    <h3 className="mt-6 text-sm font-semibold text-ink">Topics</h3>
                    <div className="mt-2">
                      <PropertyIssues issues={issues} />
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <p id="signals" className="scroll-mt-32 text-sm text-mute">
                No renter summary yet.{" "}
                <a href="#reviews" className="font-semibold text-accent hover:text-accent-hover">
                  Read the reviews
                </a>
                .
              </p>
            )}
          </div>

          <div className="flex flex-col gap-5 lg:col-span-6">
            <div id="rent" className="scroll-mt-32 rounded-md bg-surface p-5 border border-rule">
              <h2 className="text-xl font-bold text-ink">Reported rent</h2>
              <div className="mt-3">
                <RentHistory groups={rentSummary} />
              </div>
            </div>
            <div id="history" className="scroll-mt-32 rounded-md bg-surface p-5 border border-rule">
              <h2 className="text-xl font-bold text-ink">Building history</h2>
              <div className="mt-3">
                <BuildingHistory property={property} reviews={reviews} rent={rentSummary} />
              </div>
            </div>
            {units.length > 0 ? (
              <div className="rounded-md bg-surface p-5 border border-rule">
                <h2 className="text-xl font-bold text-ink">Units</h2>
                <p className="mt-2 text-xs text-mute">Public unit pages only include former renters.</p>
                <ul className="mt-2">
                  {units.map((unit) => (
                    <li key={unit.id} className="border-b border-rule last:border-0">
                      <Link
                        className="flex min-h-11 items-center justify-between gap-2 hover:text-accent"
                        href={`${propertyHref}/units/${encodeURIComponent(unit.unit_key)}`}
                      >
                        <span>Unit {unit.unit_key}</span>
                        <span className="figure text-mute">
                          {unit.avg_overall_rating != null ? unit.avg_overall_rating.toFixed(1) : "—"} · {unit.review_count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="reviews" className="scroll-mt-32 bg-paper pb-8">
        <div className="dossier-wrap">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface p-4 border border-rule">
            <h2 className="text-xl font-bold text-ink">Renter reviews</h2>
            <form className="flex min-h-11 items-center gap-2 text-sm text-mute" method="get">
              <label htmlFor="sort">Sort</label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort ?? "recent"}
                className="rounded-md border-0 bg-muted py-1.5 pl-3 pr-8 text-ink"
              >
                <option value="recent">Most recent</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
                <option value="helpful">Most helpful</option>
              </select>
              <button type="submit" className="font-semibold text-accent hover:text-accent-hover">
                Apply
              </button>
            </form>
          </div>
          {reviews.length === 0 ? (
            <div className="rounded-md bg-surface p-6 border border-rule">
              <EmptyState
                title="No renter reviews yet."
                description="Be the first renter to share your experience."
                action={
                  <Link className="text-sm font-medium text-accent hover:text-accent-hover" href={`/review/new?propertyId=${property.id}`}>
                    Write a review
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {reviews.map((review) => (
                <li key={review.id}>
                  <ReviewCard
                    review={review}
                    replies={repliesByReview.get(review.id) ?? []}
                    ownPending={pendingByReview.get(review.id) ?? []}
                    loggedIn={loggedIn}
                    loginHref={`/login?next=${encodeURIComponent(`${propertyHref}#review-${review.id}`)}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="ask" className="scroll-mt-32 bg-paper pb-10">
        <div className="dossier-wrap">
          <AskLivRank propertyId={property.id} />
        </div>
      </section>

      {nearby.length > 0 ? (
        <section className="bg-muted py-10">
          <div className="dossier-wrap">
            <h2 className="text-2xl font-bold text-ink">Other buildings in {property.city}</h2>
            <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {nearby.map((row) => (
                <li key={row.id}>
                  <Link href={`/property/${row.slug || row.id}`} className="block rounded-md bg-surface p-4 border border-rule hover:text-accent">
                    <span className="block font-semibold text-ink">{row.address_line_1}</span>
                    <span className="mt-1 block text-sm text-mute">
                      {row.review_count} {row.review_count === 1 ? "review" : "reviews"}
                      {row.last_review_date ? ` · updated ${formatDate(row.last_review_date)}` : ""}
                    </span>
                    {row.review_count >= MIN_REVIEWS_FOR_RATING && row.avg_overall_rating != null ? (
                      <span className="mt-3 flex items-center gap-2">
                        <span className="figure text-sm font-bold text-ink">{row.avg_overall_rating.toFixed(1)} / 5</span>
                        <Stars
                          value={row.avg_overall_rating}
                          showValue={false}
                          label={`${row.avg_overall_rating.toFixed(1)} out of 5`}
                        />
                      </span>
                    ) : (
                      <span className="figure mt-3 block text-sm font-bold text-ink">—</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
