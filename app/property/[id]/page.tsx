import {
  getOwnPendingRepliesByReview,
  getPropertyPageData,
  getPropertyReviews,
  getPropertyUnits,
  getPublishedPhotosByReview,
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
  cityCanonicalPath,
  pageMetadata,
  provinceExplorePath,
  provinceLabel,
  propertyCanonicalPath,
  propertyDescription,
  propertyJsonLd,
  propertyTitle,
  visibleRating,
} from "@/lib/seo";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { sort } = await searchParams;
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
  const hasContent = data.reviewCount > 0 || data.property.rent_report_count > 0;
  const index = hasContent && (!sort || sort === "recent");
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
  const reviewSort = sort ?? "recent";
  const [sorted, units, nearby, session] = await Promise.all([
    reviewSort === "recent"
      ? Promise.resolve({ reviews: data.recentReviews, total: data.reviewTotal })
      : getPropertyReviews(property.id, { sort: reviewSort, page: 1, pageSize: 10 }),
    getPropertyUnits(property.id),
    listNearbyProperties(property),
    getSessionUser(),
  ]);
  const reviewIds = sorted.reviews.map((review) => review.id);
  const [repliesByReview, pendingByReview, photosByReview] = await Promise.all([
    getPublishedRepliesByReview(reviewIds),
    session ? getOwnPendingRepliesByReview(reviewIds, session.id) : Promise.resolve(new Map()),
    getPublishedPhotosByReview(reviewIds),
  ]);
  track("property_view");
  const rating = visibleRating(ratingSummary);
  const cityPath = cityCanonicalPath({ city: property.city, province: property.province });

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
          { name: provinceLabel(property.province), path: provinceExplorePath(property.province) },
          { name: property.city, path: cityPath },
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
        photosByReview={photosByReview}
        loggedIn={Boolean(session)}
      />
    </div>
  );
}
