import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getPropertyForContribution } from "@/lib/properties/queries";
import { mapboxToken } from "@/lib/address/provider";
import { ReviewForm } from "@/components/review-form";
import { ContributionHeader } from "@/components/contribution-header";

export const metadata: Metadata = { title: "Write a review", robots: { index: false, follow: false } };

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; unit?: string; note?: string; title?: string }>;
}) {
  const { propertyId, unit, note, title } = await searchParams;
  if (!propertyId) redirect("/rate");
  const user = await getSessionUser();
  const reviewPath = `/review/new?propertyId=${propertyId}${unit ? `&unit=${encodeURIComponent(unit)}` : ""}`;
  if (!user) redirect(`/login?next=${encodeURIComponent(reviewPath)}`);
  const property = await getPropertyForContribution(propertyId);
  if (!property) redirect("/rate");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Share your experience</h1>
      <ContributionHeader property={property} mapToken={mapboxToken()} />
      <p className="mt-4 text-sm text-ink">
        Describe specific events or conditions you personally experienced. Do not post private information about
        other people, threats, harassment, or unsupported serious accusations.
      </p>
      <ReviewForm
        propertyId={property.id}
        propertyHref={property.status === "active" ? `/property/${property.slug || property.id}` : undefined}
        unitLabel={unit ?? ""}
        draftTitle={title ?? ""}
        draftBody={note ?? ""}
      />
    </div>
  );
}
