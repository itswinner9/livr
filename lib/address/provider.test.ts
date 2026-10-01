import { afterEach, describe, expect, it, vi } from "vitest";
import { mapSearchBoxFeature, retrieveAddress, suggestAddresses, toDraft } from "./provider";
import { draftFromSearchParams, draftToSearchParams, addressDraftInputSchema } from "./draft-params";

const SESSION = "0b9e7c1e-4f7a-4c55-9d0e-3f1f2c3d4e5f";

const surreyFeature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [-122.849, 49.188] as [number, number] },
  properties: {
    name: "123 Main Street",
    mapbox_id: "dXJuOm1ieGFkcjpmYWtlLXN1cnJleQ",
    feature_type: "address",
    address: "123 Main Street",
    full_address: "123 Main Street, Surrey, British Columbia V3T 1A1, Canada",
    place_formatted: "Surrey, British Columbia V3T 1A1, Canada",
    coordinates: { latitude: 49.188, longitude: -122.849 },
    context: {
      country: { name: "Canada", country_code: "CA", country_code_alpha_3: "CAN" },
      region: { name: "British Columbia", region_code: "BC", region_code_full: "CA-BC" },
      postcode: { name: "V3T 1A1" },
      place: { name: "Surrey" },
      street: { name: "Main Street" },
      address: { name: "123 Main Street", address_number: "123", street_name: "Main Street" },
    },
  },
};

describe("mapSearchBoxFeature", () => {
  it("keeps the house number and normalizes province and postal code", () => {
    const r = mapSearchBoxFeature(surreyFeature)!;
    expect(r.address_line_1).toBe("123 Main Street");
    expect(r.city).toBe("Surrey");
    expect(r.province).toBe("BC");
    expect(r.postal_code).toBe("V3T 1A1");
    expect(r.latitude).toBeCloseTo(49.188);
    expect(r.longitude).toBeCloseTo(-122.849);
    expect(r.provider_place_id).toBe(surreyFeature.properties.mapbox_id);
    expect(r.normalized_address).toBe("123 main street surrey bc");
  });

  it("matches the seeded property's normalized address and slug", () => {
    const d = toDraft(mapSearchBoxFeature(surreyFeature)!);
    expect(d.slug).toBe("123-main-street-surrey-bc");
    expect(d.normalized_city).toBe("surrey");
    expect(d.normalized_postal_code).toBe("V3T1A1");
  });

  it("falls back to the region name when region_code is missing", () => {
    const f = structuredClone(surreyFeature);
    f.properties.context.region = { name: "British Columbia" } as typeof f.properties.context.region;
    expect(mapSearchBoxFeature(f)?.province).toBe("BC");
  });

  it("rejects results without a street number or outside Canada", () => {
    const street = structuredClone(surreyFeature);
    street.properties.context.address = undefined as never;
    street.properties.address = "Main Street";
    street.properties.name = "Main Street";
    expect(mapSearchBoxFeature(street)).toBeNull();

    const us = structuredClone(surreyFeature);
    us.properties.context.country.country_code = "US";
    expect(mapSearchBoxFeature(us)).toBeNull();
  });
});

describe("Mapbox HTTP calls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns nothing and makes no request without a token", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await suggestAddresses("123 main", SESSION)).toEqual([]);
    expect(await retrieveAddress("abc", SESSION)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends session token and Canada filter, and maps suggestions", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "pk.test");
    const fetchMock = vi.fn(async () =>
      Response.json({
        suggestions: [
          {
            name: "123 Main Street",
            mapbox_id: "abc",
            feature_type: "address",
            place_formatted: "Surrey, British Columbia V3T 1A1, Canada",
            full_address: "123 Main Street, Surrey, British Columbia V3T 1A1, Canada",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const out = await suggestAddresses("123 main st surrey", SESSION);
    expect(out).toEqual([
      {
        mapbox_id: "abc",
        name: "123 Main Street",
        place_formatted: "Surrey, British Columbia V3T 1A1, Canada",
        full_address: "123 Main Street, Surrey, British Columbia V3T 1A1, Canada",
      },
    ]);
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe("/search/searchbox/v1/suggest");
    expect(url.searchParams.get("session_token")).toBe(SESSION);
    expect(url.searchParams.get("country")).toBe("ca");
  });

  it("returns [] when Mapbox errors", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "pk.test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    expect(await suggestAddresses("123 main", SESSION)).toEqual([]);
  });

  it("retrieves and maps a feature", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "pk.test");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ type: "FeatureCollection", features: [surreyFeature] })));
    const r = await retrieveAddress("abc", SESSION);
    expect(r?.normalized_address).toBe("123 main street surrey bc");
  });
});

describe("draft search params", () => {
  it("round-trips through the URL and validates", () => {
    const d = toDraft(mapSearchBoxFeature(surreyFeature)!);
    const params = draftToSearchParams({ ...d, intent: "rent" });
    const back = draftFromSearchParams(Object.fromEntries(params));
    const parsed = addressDraftInputSchema.parse(back);
    expect(parsed).toMatchObject({
      address_line_1: "123 Main Street",
      city: "Surrey",
      province: "BC",
      latitude: 49.188,
      intent: "rent",
    });
  });

  it("rejects addresses without a street number", () => {
    const res = addressDraftInputSchema.safeParse({ address_line_1: "Main Street", city: "Surrey", province: "BC" });
    expect(res.success).toBe(false);
  });
});
