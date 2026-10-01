import {
  getOwnPendingRepliesByReview,
  getPropertyPageData,
  getPropertyReviews,
  getPropertyUnits,
  getPublishedRepliesByReview,
  listNearbyProperties,
} from "@/lib/properties/queries";
import { PropertyDossier } from "@/components/property-dossier";
import { JsonLd } from "@/components/json-ld";
import { track } from "@/lib/analytics";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { mapboxToken } from "@/lib/address/provider";
import { getSessionUser } from "@/lib/auth/session";
import {
  breadcrumbJsonLd,
  exploreCanonicalPath,
  pageMetadata,
  propertyCanonicalPath,
  propertyDescription,
  propertyJsonLd,
  propertyTitle,
  visibleRating,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPropertyPageData(id);
  if (!data) return { title: "Property", robots: { index: false, follow: true } };
  const title = propertyTitle(data.property);
  const rating = visibleRating(data.ratingSummary);
  const description = propertyDescription({
    property: data.property,
    reviewCount: data.reviewCount,
    rating,
  });
  const path = propertyCanonicalPath(data.property);
  const index = data.reviewCount > 0 || data.property.rent_report_count > 0;
  return {
    ...pageMetadata(title, description, path),
    robots: index ? undefined : { index: false, follow: true },
  };
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const { sort } = await searchParams;
  const data = await getPropertyPageData(id);
  if (!data) notFound();
  const canonical = propertyCanonicalPath(data.property);
  if (`/property/${id}` !== canonical) redirect(canonical);
  const { property, ratingSummary, rentSummary, issues, aiSummary } = data;
  const [sorted, units, nearby, session] = await Promise.all([
    getPropertyReviews(property.id, { sort: sort ?? "recent", page: 1, pageSize: 10 }),
    getPropertyUnits(property.id),
    listNearbyProperties(property),
    getSessionUser(),
  ]);
  const reviewIds = sorted.reviews.map((review) => review.id);
  const [repliesByReview, pendingByReview] = await Promise.all([
    getPublishedRepliesByReview(reviewIds),
    session ? getOwnPendingRepliesByReview(reviewIds, session.id) : Promise.resolve(new Map()),
  ]);
  track("property_view");
  const rating = visibleRating(ratingSummary);
  const explorePath = exploreCanonicalPath({ city: property.city, province: property.province });

  return (
    <div className="w-full">
      <JsonLd
        data={propertyJsonLd({
          property,
          reviewCount: ratingSummary.reviewCount,
          rating,
          reviews: sorted.reviews,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Explore", path: "/explore" },
          { name: property.city, path: explorePath },
          { name: property.address_line_1, path: propertyCanonicalPath(property) },
        ])}
      />
      <PropertyDossier
        property={property}
        ratingSummary={ratingSummary}
        rentSummary={rentSummary}
        issues={issues}
        aiSummary={aiSummary}
        reviews={sorted.reviews}
        sort={sort}
        units={units}
        nearby={nearby}
        token={mapboxToken()}
        repliesByReview={repliesByReview}
        pendingByReview={pendingByReview}
        loggedIn={Boolean(session)}
      />
    </div>
  );
}
