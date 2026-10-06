import { ImageResponse } from "next/og";
import { OgFrame, OG_SIZE } from "@/lib/og-frame";
import { getPropertyById } from "@/lib/properties/queries";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import { propertyDisplayName } from "@/lib/seo";

export const alt = "LivRank building file";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) {
    return new ImageResponse(
      <OgFrame kicker="LivRank" title="Building file" detail="Renter-reported reviews and rent." />,
      { ...OG_SIZE },
    );
  }
  const rating =
    property.review_count >= MIN_REVIEWS_FOR_RATING && property.avg_overall_rating != null
      ? `${Number(property.avg_overall_rating).toFixed(1)} / 5`
      : null;
  const reviewLabel =
    property.review_count > 0
      ? `${property.review_count} renter ${property.review_count === 1 ? "review" : "reviews"}`
      : "No published ratings yet";
  return new ImageResponse(
    (
      <OgFrame
        kicker={`${property.city}, ${property.province}`}
        title={propertyDisplayName(property)}
        detail={reviewLabel}
        score={rating}
      />
    ),
    { ...OG_SIZE },
  );
}
