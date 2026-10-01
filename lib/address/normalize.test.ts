import { describe, expect, it } from "vitest";
import {
  buildNormalizedAddress,
  formatPostalCode,
  isSameProperty,
  normalizePostalCode,
  normalizeProvince,
  normalizeSearchQuery,
  normalizeStreet,
  parseFreeformAddress,
  slugifyAddress,
  stripUnit,
  normalizeUnit,
  extractUnit,
} from "./normalize";

describe("normalizeStreet", () => {
  it.each([
    "123 Main St",
    "123 Main Street",
    "123 MAIN STREET",
    "123 Main St.",
    "  123   main   st  ",
  ])("normalizes %s to '123 main street'", (input) => {
    expect(normalizeStreet(input)).toBe("123 main street");
  });

  it("expands directions and suffixes", () => {
    expect(normalizeStreet("123 W Hastings St")).toBe("123 west hastings street");
    expect(normalizeStreet("1450 Kingsway Ave NW")).toBe("1450 kingsway avenue northwest");
  });

  it("treats 'St' before a name as Saint", () => {
    expect(normalizeStreet("55 St Johns Rd")).toBe("55 saint johns road");
  });

  it("strips unit numbers so buildings are identified, not units", () => {
    expect(stripUnit("1203-123 Main St")).toBe("123 Main St");
    expect(stripUnit("#5 - 123 Main St")).toBe("123 Main St");
    expect(stripUnit("Unit 5, 123 Main St")).toBe("123 Main St");
    expect(stripUnit("123 Main St Apt 4B")).toBe("123 Main St");
    expect(normalizeStreet("1203-123 Main St.")).toBe("123 main street");
  });
});

describe("normalizeUnit and extractUnit", () => {
  it("normalizes unit labels to a canonical key", () => {
    expect(normalizeUnit("#1204")).toBe("1204");
    expect(normalizeUnit("Unit 12B")).toBe("12B");
    expect(normalizeUnit("apt 4")).toBe("4");
    expect(normalizeUnit("PH2")).toBe("PH2");
    expect(normalizeUnit("ph-2")).toBe("PH-2");
    expect(normalizeUnit("  suite 807  ")).toBe("807");
  });

  it("rejects slurs, sentences, and oversized labels", () => {
    expect(normalizeUnit("this is a slur")).toBeNull();
    expect(normalizeUnit("!!!")).toBeNull();
    expect(normalizeUnit("12345678901")).toBeNull();
    expect(normalizeUnit("")).toBeNull();
  });

  it("extracts a unit from a typed address or label", () => {
    expect(extractUnit("1204-13688 100 Ave")).toBe("1204");
    expect(extractUnit("#1204")).toBe("1204");
    expect(extractUnit("Unit 12B")).toBe("12B");
    expect(extractUnit("PH2")).toBe("PH2");
    expect(extractUnit("123 Main St Apt 4B")).toBe("4B");
    expect(extractUnit("13688 100 Ave")).toBeNull();
  });
});

describe("province and postal code", () => {
  it("normalizes province names and codes", () => {
    expect(normalizeProvince("bc")).toBe("BC");
    expect(normalizeProvince("British Columbia")).toBe("BC");
    expect(normalizeProvince("Québec")).toBe("QC");
    expect(normalizeProvince("B.C.")).toBe("BC");
    expect(normalizeProvince("Texas")).toBeNull();
  });

  it("validates and formats Canadian postal codes", () => {
    expect(normalizePostalCode("v3t 1a1")).toBe("V3T1A1");
    expect(normalizePostalCode("V3T1A1")).toBe("V3T1A1");
    expect(formatPostalCode("v3t1a1")).toBe("V3T 1A1");
    expect(normalizePostalCode("12345")).toBeNull();
    expect(normalizePostalCode("D3T 1A1")).toBeNull();
  });
});

describe("parseFreeformAddress", () => {
  it("parses comma-separated addresses", () => {
    expect(parseFreeformAddress("123 Main St., Surrey, BC V3T 1A1")).toEqual({
      address_line_1: "123 Main St.",
      city: "Surrey",
      province: "BC",
      postal_code: "V3T1A1",
    });
  });

  it("parses addresses without commas", () => {
    expect(parseFreeformAddress("123 Main Street Surrey BC")).toEqual({
      address_line_1: "123 Main Street",
      city: "Surrey",
      province: "BC",
      postal_code: null,
    });
    expect(parseFreeformAddress("15 Demo Crescent New Westminster British Columbia")).toMatchObject({
      address_line_1: "15 Demo Crescent",
      city: "New Westminster",
      province: "BC",
    });
  });
});

describe("property identity", () => {
  const base = { city: "Surrey", province: "BC" };

  it("dedupes common variants to the same normalized address", () => {
    const variants = [
      { address_line_1: "123 Main St", ...base },
      { address_line_1: "123 Main Street", ...base },
      { address_line_1: "123 MAIN STREET", ...base },
      { address_line_1: "123 Main St.", city: "surrey", province: "British Columbia" },
    ];
    const keys = new Set(variants.map(buildNormalizedAddress));
    expect([...keys]).toEqual(["123 main street surrey bc"]);
  });

  it("matches free-form input to the same property", () => {
    const parsed = parseFreeformAddress("123 Main Street Surrey BC");
    expect(
      isSameProperty(
        { address_line_1: parsed.address_line_1!, city: parsed.city!, province: parsed.province! },
        { address_line_1: "123 Main St", city: "Surrey", province: "BC" },
      ),
    ).toBe(true);
  });

  it("matches by postal code when the city is written differently", () => {
    expect(
      isSameProperty(
        { address_line_1: "123 Main St", city: "Surrey Central", province: "BC", postal_code: "V3T 1A1" },
        { address_line_1: "123 Main Street", city: "Surrey", province: "BC", postal_code: "v3t1a1" },
      ),
    ).toBe(true);
  });

  it("matches by provider place id and by nearby coordinates", () => {
    expect(
      isSameProperty(
        { address_line_1: "123 Main", city: "A", province: "BC", provider_place_id: "p1" },
        { address_line_1: "999 Other", city: "B", province: "BC", provider_place_id: "p1" },
      ),
    ).toBe(true);
    expect(
      isSameProperty(
        { address_line_1: "123 Main St", city: "Surrey", province: "BC", latitude: 49.188, longitude: -122.849 },
        { address_line_1: "123 King George Blvd", city: "Surrey", province: "BC", latitude: 49.18801, longitude: -122.84901 },
      ),
    ).toBe(true);
  });

  it("does not match different civic numbers, cities, or provinces", () => {
    expect(
      isSameProperty(
        { address_line_1: "123 Main St", ...base },
        { address_line_1: "125 Main St", ...base },
      ),
    ).toBe(false);
    expect(
      isSameProperty(
        { address_line_1: "123 Main St", ...base },
        { address_line_1: "123 Main St", city: "Vancouver", province: "BC" },
      ),
    ).toBe(false);
    expect(
      isSameProperty(
        { address_line_1: "123 Main St", city: "Surrey", province: "BC" },
        { address_line_1: "123 Main St", city: "Surrey", province: "ON" },
      ),
    ).toBe(false);
  });

  it("creates SEO slugs", () => {
    expect(slugifyAddress({ address_line_1: "123 Main St.", city: "Surrey", province: "BC" })).toBe(
      "123-main-street-surrey-bc",
    );
  });
});

describe("normalizeSearchQuery", () => {
  it("normalizes addresses, postal codes, and place names", () => {
    expect(normalizeSearchQuery("123 Main Street Surrey")).toBe("123 main street surrey");
    expect(normalizeSearchQuery("123 Main St., Surrey, BC")).toBe("123 main street surrey bc");
    expect(normalizeSearchQuery("V3T 1A1")).toBe("v3t1a1");
    expect(normalizeSearchQuery("Downtown Vancouver")).toBe("downtown vancouver");
    expect(normalizeSearchQuery("Surrey, British Columbia")).toBe("surrey bc");
  });
});
