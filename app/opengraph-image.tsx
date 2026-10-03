import { ImageResponse } from "next/og";
import { OgFrame, OG_SIZE } from "@/lib/og-frame";
import { SITE_TAGLINE } from "@/lib/seo";

export const alt = `LivRank — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <OgFrame kicker="Renter-reported building files" title="Know before you move to your new home." detail="Renter-reported reviews and rent. Not official history." />,
    { ...OG_SIZE },
  );
}
