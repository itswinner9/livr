import { ImageResponse } from "next/og";
import { OgFrame, OG_SIZE } from "@/lib/og-frame";
import { resolveCityPlace } from "@/lib/daily/queries";
import { cityBuildingCount } from "@/lib/listings/page-data";
import { listListingFacets } from "@/lib/properties/queries";
import { exploreTitle, provinceLabel } from "@/lib/seo";

export const alt = "LivRank city buildings";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ province: string; city: string }>;
}) {
  const { province, city } = await params;
  const place = await resolveCityPlace(province, city);
  if (!place) {
    return new ImageResponse(
      <OgFrame kicker="LivRank" title="Rental buildings" detail="Renter-reported reviews and rent." />,
      { ...OG_SIZE },
    );
  }
  const facets = await listListingFacets();
  const count = cityBuildingCount(facets, place.city, place.province);
  const detail =
    count > 0
      ? `${count} ${count === 1 ? "building" : "buildings"} on file`
      : "Renter-reported reviews and rent";
  return new ImageResponse(
    (
      <OgFrame
        kicker={`${place.city}, ${provinceLabel(place.province)}`}
        title={exploreTitle(place)}
        detail={detail}
      />
    ),
    { ...OG_SIZE },
  );
}
