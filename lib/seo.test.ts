import { describe, expect, it } from "vitest";
import {
  HOME_FAQS,
  cityCanonicalPath,
  cityFaqs,
  exploreCanonicalPath,
  exploreCityRedirectPath,
  exploreDescription,
  exploreTitle,
  faqJsonLd,
  itemListJsonLd,
  jsonLdString,
  listingCanonicalPath,
  listingIsFiltered,
  placeSlug,
  propertyCanonicalPath,
  propertyDescription,
} from "./seo";

describe("seo helpers", () => {
  it("builds explore titles from real place filters", () => {
    expect(exploreTitle({})).toBe("Explore rental buildings in Canada");
    expect(exploreTitle({ province: "BC" })).toBe("Rental buildings in British Columbia");
    expect(exploreTitle({ city: "Surrey", province: "BC" })).toBe("Rental buildings in Surrey, BC");
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

  it("redirects unfiltered city explore URLs and keeps facet variants on explore", () => {
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC" })).toBe("/rentals/bc/surrey");
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC", hasReviews: true })).toBeNull();
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC", propertyType: "apartment" })).toBeNull();
    expect(exploreCityRedirectPath({ city: "Surrey", province: "BC", q: "fraser" })).toBeNull();
    expect(exploreCityRedirectPath({ province: "BC" })).toBeNull();
    expect(listingIsFiltered({ hasRent: true })).toBe(true);
    expect(listingIsFiltered({})).toBe(false);
  });

  it("describes a property with only published counts", () => {
    const property = {
      address_line_1: "13688 100 Avenue",
      city: "Surrey",
      province: "BC",
      rent_report_count: 1,
    };
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("3 renter reviews");
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("average 3.3 out of 5");
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("before you move in");
    expect(
      propertyDescription({ property: { ...property, rent_report_count: 0 }, reviewCount: 0, rating: null }),
    ).toContain("No published ratings yet");
    expect(propertyCanonicalPath({ slug: "13688-100-avenue-surrey-bc", id: "abc" })).toBe(
      "/property/13688-100-avenue-surrey-bc",
    );
  });

  it("escapes HTML in JSON-LD", () => {
    expect(jsonLdString({ name: "A <script>alert(1)</script>" })).toContain("\\u003cscript>");
    expect(exploreDescription({ city: "Surrey", province: "BC" }, 2)).toContain("2 buildings on file");
    expect(exploreDescription({ city: "Surrey", province: "BC" }, 2)).toContain("Know before you move");
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
