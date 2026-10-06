import { describe, expect, it } from "vitest";
import type { Property } from "@/types/property";
import {
  HOME_FAQS,
  cityCanonicalPath,
  cityFaqs,
  exploreCanonicalPath,
  exploreCityRedirectPath,
  exploreDescription,
  exploreHeading,
  exploreTitle,
  faqJsonLd,
  itemListJsonLd,
  jsonLdString,
  listedNames,
  listingCanonicalPath,
  listingIsFiltered,
  placeSlug,
  propertyCanonicalPath,
  propertyDescription,
  propertyFaqs,
  propertyJsonLd,
  propertyOgImagePath,
  propertyTitle,
} from "./seo";

function sampleProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "abc",
    slug: "10557-150-street-surrey-bc",
    address_line_1: "10557 150 Street",
    address_line_2: null,
    city: "Surrey",
    province: "BC",
    postal_code: "V3R 7K2",
    country: "Canada",
    building_name: "Guildford Gardens",
    property_type: "apartment",
    year_built: null,
    units_count: null,
    latitude: 49.19,
    longitude: -122.8,
    normalized_address: "10557 150 street surrey bc",
    review_count: 5,
    rent_report_count: 0,
    avg_overall_rating: 3.4,
    last_review_date: null,
    last_rent_report_date: null,
    has_manager: false,
    has_ai_summary: false,
    is_demo: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("seo helpers", () => {
  it("builds explore titles from real place filters", () => {
    expect(exploreTitle({})).toBe("Explore rental building reviews in Canada");
    expect(exploreTitle({ province: "BC" })).toBe("Renter reviews of buildings in British Columbia");
    expect(exploreTitle({ city: "Surrey", province: "BC" })).toBe(
      "Renter reviews of buildings in Surrey, BC",
    );
    expect(exploreHeading({ city: "Surrey", province: "BC" })).toBe("Building reviews in Surrey, BC");
  });

  it("uses a stable explore canonical without extra filters", () => {
    expect(exploreCanonicalPath({})).toBe("/explore");
    expect(exploreCanonicalPath({ city: "Surrey", province: "BC" })).toBe(
      "/explore?city=Surrey&province=BC",
    );
  });

  it("builds city rental paths for SEO", () => {
    expect(placeSlug("New Westminster")).toBe("new-westminster");
    expect(placeSlug("St. John's")).toBe("st-johns");
    expect(cityCanonicalPath({ city: "Surrey", province: "BC" })).toBe("/rentals/bc/surrey");
    expect(listingCanonicalPath({ city: "Surrey", province: "BC" })).toBe("/rentals/bc/surrey");
    expect(listingCanonicalPath({ province: "BC" })).toBe("/explore?province=BC");
    expect(cityFaqs("Surrey", "BC")[0]?.question).toContain("Surrey, BC");
    expect(itemListJsonLd({ name: "Surrey", path: "/rentals/bc/surrey", items: [] })["@type"]).toBe(
      "ItemList",
    );
  });

  it("names buildings already on the city file in FAQs", () => {
    const faqs = cityFaqs("Surrey", "BC", ["Guildford Gardens", "Park Place Two"]);
    expect(faqs.some((faq) => faq.question.includes("Which Surrey buildings have renter reviews"))).toBe(
      true,
    );
    expect(faqs.some((faq) => faq.answer.includes("Guildford Gardens and Park Place Two"))).toBe(true);
  });

  it("redirects unfiltered city explore URLs and keeps facet variants on explore", () => {
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC" })).toBe("/rentals/bc/surrey");
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC", hasReviews: true })).toBeNull();
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC", propertyType: "apartment" })).toBeNull();
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC", q: "fraser" })).toBeNull();
    expect(exploreCityRedirectPath({ province: "BC" })).toBeNull();
    expect(listingIsFiltered({ hasRent: true })).toBe(true);
    expect(listingIsFiltered({})).toBe(false);
  });

  it("titles a named building for reviews searches", () => {
    expect(propertyTitle(sampleProperty())).toBe("Guildford Gardens reviews in Surrey, BC");
    expect(propertyTitle(sampleProperty({ building_name: null }))).toBe(
      "10557 150 Street reviews in Surrey, BC",
    );
  });

  it("describes a property with only published counts", () => {
    const property = {
      building_name: "Park Place Two",
      address_line_1: "13688 100 Avenue",
      city: "Surrey",
      province: "BC",
      rent_report_count: 1,
    };
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("3 renter reviews");
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain(
      "Park Place Two at 13688 100 Avenue",
    );
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("Average 3.3 out of 5");
    expect(
      propertyDescription({ property: { ...property, rent_report_count: 0 }, reviewCount: 0, rating: null }),
    ).toContain("No published ratings yet");
    expect(
      propertyDescription({ property: { ...property, rent_report_count: 0 }, reviewCount: 0, rating: null }),
    ).toContain("before you move in");
    expect(propertyCanonicalPath({ slug: "13688-100-avenue-surrey-bc", id: "abc" })).toBe(
      "/property/13688-100-avenue-surrey-bc",
    );
    expect(propertyOgImagePath({ slug: "13688-100-avenue-surrey-bc", id: "abc" })).toBe(
      "/property/13688-100-avenue-surrey-bc/opengraph-image",
    );
  });

  it("marks apartments as LocalBusiness with the address as an alternate name", () => {
    const json = propertyJsonLd({
      property: sampleProperty(),
      reviewCount: 5,
      rating: 3.4,
      reviews: [
        {
          id: "r1",
          review_title: "Large, quiet suite if the hallway is still",
          review_body: "The suite itself is clean and roomy enough for a lot of bookcases, and it already feels like home.",
          overall_rating: 4,
          renter_status: "current",
          published_at: "2026-04-10T12:00:00.000Z",
        },
      ],
    });
    expect(json["@type"]).toEqual(["LocalBusiness", "ApartmentComplex"]);
    expect(json.name).toBe("Guildford Gardens");
    expect(json.alternateName).toBe("10557 150 Street");
    expect(String(json.image)).toContain("/property/10557-150-street-surrey-bc/opengraph-image");
    expect(json.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 3.4,
      reviewCount: 5,
    });
    expect(json.review).toHaveLength(1);
  });

  it("keeps House as a LocalBusiness subtype", () => {
    const json = propertyJsonLd({
      property: sampleProperty({ building_name: null, property_type: "house" }),
      reviewCount: 0,
      rating: null,
      reviews: [],
    });
    expect(json["@type"]).toEqual(["LocalBusiness", "House"]);
    expect(json.alternateName).toBeUndefined();
  });

  it("grounds property FAQs in published counts", () => {
    const faqs = propertyFaqs(sampleProperty(), { reviewCount: 5, rating: 3.4 });
    expect(faqs[0]?.question).toBe("What do renters say about Guildford Gardens?");
    expect(faqs[0]?.answer).toContain("5 published renter reviews");
    expect(faqs[0]?.answer).toContain("average 3.4 out of 5");
    expect(faqs[1]?.answer).toContain("10557 150 Street");
    expect(jsonLdString(faqJsonLd(faqs))).toContain("does not claim official rental history");
  });

  it("joins a short list of building names", () => {
    expect(listedNames(["Guildford Gardens"])).toBe("Guildford Gardens");
    expect(listedNames(["A", "B"])).toBe("A and B");
    expect(listedNames(["A", "B", "C"])).toBe("A, B, and C");
    expect(listedNames(["A", "B", "C", "D", "E", "F", "G", "H", "I"], 8)).toBe(
      "A, B, C, D, E, F, G, and H",
    );
  });

  it("escapes HTML in JSON-LD", () => {
    expect(jsonLdString({ name: "A <script>alert(1)</script>" })).toContain("\\u003cscript>");
    expect(exploreDescription({ city: "Surrey", province: "BC" }, 2)).toContain("2 buildings on file");
    expect(exploreDescription({ city: "Surrey", province: "BC" }, 2)).toContain("renter reviews of buildings");
  });

  it("describes FAQs without claiming official history", () => {
    const json = faqJsonLd();
    expect(json["@type"]).toBe("FAQPage");
    expect(json.mainEntity).toHaveLength(HOME_FAQS.length);
    const text = jsonLdString(json);
    expect(text).toContain("before I move to my new home");
    expect(text).toContain("does not claim official rental history");
  });
});
