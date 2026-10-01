import { NextResponse, type NextRequest } from "next/server";
import { suggestAddresses } from "@/lib/address/provider";
import { buildNormalizedAddress, normalizeProvince, parseFreeformAddress } from "@/lib/address/normalize";
import { searchProperties } from "@/lib/properties/queries";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import { memoryRateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/utils";

export type SuggestResponse = {
  properties: Array<{
    id: string;
    slug: string | null;
    address_line_1: string;
    city: string;
    province: string;
    building_name: string | null;
    review_count: number;
    rating: number | null;
  }>;
  suggestions: Array<{ mapbox_id: string; name: string; place_formatted: string; full_address: string }>;
};

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const session = request.nextUrl.searchParams.get("session") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!memoryRateLimit(`addressSuggest:${ip}`, 90, 60)) {
    return NextResponse.json({ error: "Too many searches. Try again in a minute." }, { status: 429 });
  }
  if (q.length < 2) return NextResponse.json({ properties: [], suggestions: [] } satisfies SuggestResponse);

  const province = normalizeProvince(request.nextUrl.searchParams.get("province") ?? "") ?? "";
  const city = (request.nextUrl.searchParams.get("city") ?? "").trim();
  const [properties, suggestions] = await Promise.all([
    searchProperties(q),
    isUuid(session)
      ? suggestAddresses(q, session, {
          province: province || undefined,
          city: city || undefined,
        })
      : Promise.resolve([]),
  ]);

  const known = new Set(properties.map((p) => p.normalized_address));
  const body: SuggestResponse = {
    properties: properties.slice(0, 5).map((p) => ({
      id: p.id,
      slug: p.slug,
      address_line_1: p.address_line_1,
      city: p.city,
      province: p.province,
      building_name: p.building_name,
      review_count: p.review_count,
      rating: p.review_count >= MIN_REVIEWS_FOR_RATING ? p.avg_overall_rating : null,
    })),
    suggestions: suggestions.filter((s) => {
      const parsed = parseFreeformAddress(s.full_address.replace(/,?\s*canada\s*$/i, ""));
      if (!parsed.address_line_1 || !parsed.city || !parsed.province) return true;
      return !known.has(buildNormalizedAddress({ ...parsed, address_line_1: parsed.address_line_1, city: parsed.city, province: parsed.province }));
    }),
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, max-age=30" } });
}
