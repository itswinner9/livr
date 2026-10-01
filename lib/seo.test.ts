import { describe, expect, it } from "vitest";
import {
  exploreCanonicalPath,
  exploreDescription,
  exploreTitle,
  jsonLdString,
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

  it("describes a property with only published counts", () => {
    const property = {
      address_line_1: "13688 100 Avenue",
      city: "Surrey",
      province: "BC",
      rent_report_count: 1,
    };
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("3 renter reviews");
    expect(propertyDescription({ property, reviewCount: 3, rating: 3.3 })).toContain("average 3.3 out of 5");
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
  });
});
