import { getOwnPendingRepliesByReview, getPropertyById, getPublishedRepliesByReview, getUnitReviews } from "@/lib/properties/queries";
import { ReviewCard } from "@/components/review-card";
import { getSessionUser } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; unit: string }>;
}): Promise<Metadata> {
  const { id, unit } = await params;
  const property = await getPropertyById(id);
  if (!property) return { title: "Unit" };
  const key = decodeURIComponent(unit).toUpperCase();
  const title = `Unit ${key} · ${property.address_line_1}`;
  return {
    title,
    description: `Former-renter reviews for unit ${key} at ${property.address_line_1} in ${property.city}, ${property.province}.`,
    alternates: { canonical: `/property/${property.slug || property.id}/units/${encodeURIComponent(key)}` },
    openGraph: {
      title: `${title} | LivRank`,
      description: `Former-renter reviews for unit ${key} at ${property.address_line_1}.`,
    },
  };
}

export default async function PropertyUnitPage({
  params,
}: {
  params: Promise<{ id: string; unit: string }>;
}) {
  const { id, unit } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();
  const key = decodeURIComponent(unit).toUpperCase();
  const { unit: publicUnit, reviews } = await getUnitReviews(property.id, key);
  if (!publicUnit || reviews.length === 0) notFound();
  const propertyHref = `/property/${property.slug || property.id}`;
  const session = await getSessionUser();
  const reviewIds = reviews.map((review) => review.id);
  const [repliesByReview, pendingByReview] = await Promise.all([
    getPublishedRepliesByReview(reviewIds),
    session ? getOwnPendingRepliesByReview(reviewIds, session.id) : Promise.resolve(new Map()),
  ]);
  const avg = publicUnit.avg_overall_rating;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-sm text-mute">
        <Link className="hover:text-ink" href={propertyHref}>
          {property.address_line_1}
        </Link>
        <span>
          , {property.city}, {property.province}
        </span>
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-ink">Unit {publicUnit.unit_key}</h1>
      <p className="mt-3 text-sm text-mute">
        {avg != null ? (
          <>
            <span className="figure text-ink">{avg.toFixed(1)}</span>
            <span>
              {" "}
              from {publicUnit.review_count} {publicUnit.review_count === 1 ? "review" : "reviews"}
            </span>
          </>
        ) : (
          <span>
            {publicUnit.review_count} {publicUnit.review_count === 1 ? "review" : "reviews"}
          </span>
        )}
      </p>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Only former renters&apos; unit numbers are shown. Current renters&apos; reviews still count toward the
        building.
      </p>
      <div className="mt-6 border-b border-rule pb-6">
        <Link
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-paper hover:bg-accent-hover"
          href={`/review/new?propertyId=${property.id}&unit=${encodeURIComponent(publicUnit.unit_key)}`}
        >
          Rate this unit
        </Link>
      </div>
      <section className="mt-8">
        <h2 className="text-sm font-medium text-ink">Former renter reviews</h2>
        <div className="mt-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              replies={repliesByReview.get(review.id) ?? []}
              ownPending={pendingByReview.get(review.id) ?? []}
              loggedIn={Boolean(session)}
              loginHref={`/login?next=${encodeURIComponent(`${propertyHref}/units/${encodeURIComponent(publicUnit.unit_key)}#review-${review.id}`)}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
