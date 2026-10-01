import {
  buildNormalizedAddress,
  formatPostalCode,
  normalizeCity,
  normalizePostalCode,
  normalizeProvince,
  slugifyAddress,
} from "./normalize";

export type AddressResult = {
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  provider_place_id: string | null;
  normalized_address: string;
};

export type AddressSuggestion = {
  mapbox_id: string;
  name: string;
  place_formatted: string;
  full_address: string;
};

/** A geocoded address ready to become (or match) a LivRank property. */
export type AddressDraft = AddressResult & {
  normalized_city: string;
  normalized_postal_code: string | null;
  slug: string;
};

const SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1";
const TIMEOUT_MS = 4000;

export function mapboxToken(): string | null {
  return process.env.MAPBOX_ACCESS_TOKEN || null;
}

export function hasAddressProvider() {
  return mapboxToken() !== null;
}

export function normalizeAddress(result: AddressResult): AddressResult {
  const province = normalizeProvince(result.province) ?? result.province;
  return {
    ...result,
    province,
    postal_code: formatPostalCode(result.postal_code) ?? result.postal_code,
    country: result.country || "Canada",
    normalized_address: buildNormalizedAddress({
      address_line_1: result.address_line_1,
      city: result.city,
      province,
    }),
  };
}

export function toDraft(result: AddressResult): AddressDraft {
  const normalized = normalizeAddress(result);
  return {
    ...normalized,
    normalized_city: normalizeCity(normalized.city),
    normalized_postal_code: normalizePostalCode(normalized.postal_code),
    slug: slugifyAddress(normalized),
  };
}

type SearchBoxContext = {
  address?: { name?: string; address_number?: string; street_name?: string };
  street?: { name?: string };
  place?: { name?: string };
  locality?: { name?: string };
  region?: { name?: string; region_code?: string };
  postcode?: { name?: string };
  country?: { country_code?: string };
};

type SearchBoxFeature = {
  geometry?: { coordinates?: [number, number] };
  properties: {
    mapbox_id: string;
    name?: string;
    feature_type?: string;
    address?: string;
    full_address?: string;
    coordinates?: { latitude?: number; longitude?: number };
    context?: SearchBoxContext;
  };
};

/** Maps a Search Box /retrieve feature to a LivRank address, or null if it isn't a Canadian street address. */
export function mapSearchBoxFeature(feature: SearchBoxFeature): AddressResult | null {
  const p = feature.properties;
  const ctx = p.context ?? {};
  if (ctx.country?.country_code && ctx.country.country_code.toLowerCase() !== "ca") return null;
  const number = ctx.address?.address_number?.trim();
  const street = (ctx.address?.street_name ?? ctx.street?.name)?.trim();
  const line1 = number && street ? `${number} ${street}` : (p.address ?? ctx.address?.name ?? p.name ?? "").trim();
  const city = (ctx.place?.name ?? ctx.locality?.name ?? "").trim();
  const province = normalizeProvince(ctx.region?.region_code) ?? normalizeProvince(ctx.region?.name);
  if (!line1 || !/^\d/.test(line1) || !city || !province) return null;
  const lat = p.coordinates?.latitude ?? feature.geometry?.coordinates?.[1] ?? null;
  const lng = p.coordinates?.longitude ?? feature.geometry?.coordinates?.[0] ?? null;
  return normalizeAddress({
    address_line_1: line1,
    address_line_2: null,
    city,
    province,
    postal_code: ctx.postcode?.name ?? null,
    country: "Canada",
    latitude: lat,
    longitude: lng,
    provider_place_id: p.mapbox_id,
    normalized_address: "",
  });
}

async function fetchJson<T>(url: URL): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function suggestAddresses(
  query: string,
  sessionToken: string,
  hint?: { province?: string; city?: string },
): Promise<AddressSuggestion[]> {
  const token = mapboxToken();
  let q = query.trim();
  const province = hint?.province?.trim().toUpperCase();
  const city = hint?.city?.trim();
  if (province && !q.toUpperCase().includes(province)) {
    q = `${q} ${province}`;
  }
  if (city && /\d/.test(q) && !q.toLowerCase().includes(city.toLowerCase())) {
    q = `${q} ${city}`;
  }
  if (!token || q.length < 3) return [];
  const url = new URL(`${SEARCHBOX_URL}/suggest`);
  url.searchParams.set("q", q.slice(0, 256));
  url.searchParams.set("access_token", token);
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("country", "ca");
  url.searchParams.set("language", "en");
  url.searchParams.set("types", "address");
  url.searchParams.set("limit", "6");
  const data = await fetchJson<{
    suggestions?: Array<{
      mapbox_id: string;
      name: string;
      feature_type?: string;
      full_address?: string;
      place_formatted?: string;
    }>;
  }>(url);
  return (data?.suggestions ?? [])
    .filter((s) => s.mapbox_id && s.name)
    .map((s) => ({
      mapbox_id: s.mapbox_id,
      name: s.name,
      place_formatted: s.place_formatted ?? "",
      full_address: s.full_address ?? [s.name, s.place_formatted].filter(Boolean).join(", "),
    }));
}

export async function retrieveAddress(mapboxId: string, sessionToken: string): Promise<AddressResult | null> {
  const token = mapboxToken();
  if (!token || !mapboxId) return null;
  const url = new URL(`${SEARCHBOX_URL}/retrieve/${encodeURIComponent(mapboxId)}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("session_token", sessionToken);
  const data = await fetchJson<{ features?: SearchBoxFeature[] }>(url);
  const feature = data?.features?.[0];
  return feature ? mapSearchBoxFeature(feature) : null;
}
