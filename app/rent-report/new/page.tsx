import { getSessionUser } from "@/lib/auth/session";
import { getPropertyForContribution } from "@/lib/properties/queries";
import { mapboxToken } from "@/lib/address/provider";
import { ContributionHeader } from "@/components/contribution-header";
import { RentReportForm } from "@/components/rent-report-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Report rent", robots: { index: false, follow: false } };

export default async function NewRentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; submitted?: string; error?: string }>;
}) {
  const { propertyId, submitted, error } = await searchParams;
  if (!propertyId) redirect("/rate");
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/rent-report/new?propertyId=${propertyId}`)}`);
  const property = await getPropertyForContribution(propertyId);
  if (!property) redirect("/rate");
  const propertyHref = property.status === "active" ? `/property/${property.slug || property.id}` : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Report your rent</h1>
      <ContributionHeader property={property} mapToken={mapboxToken()} />
      <p className="mt-4 text-sm text-mute">
        Report what you paid. You do not need to rate the building. This may not represent every unit.
      </p>
      {submitted ? (
        <div className="mt-6 rounded-md border border-accent/20 bg-accent/10 p-5 text-sm text-ink" role="status">
          <p className="font-medium">Thanks. Your rent report has been submitted for moderation.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="font-medium underline" href={`/review/new?propertyId=${property.id}`}>
              Also write a review
            </Link>
            {propertyHref ? (
              <Link className="underline" href={propertyHref}>
                Back to the property
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <RentReportForm propertyId={property.id} propertyHref={propertyHref} initialError={error} />
      )}
    </div>
  );
}
