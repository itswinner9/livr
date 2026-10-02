import type { Metadata } from "next";
import { PROVINCE_NAMES, type ProvinceCode } from "@/lib/address/normalize";
import { appUrl } from "@/lib/env";
import { MIN_REVIEWS_FOR_RATING } from "@/lib/ratings/aggregate";
import { PROPERTY_TYPE_LABELS, type Property, type RatingSummary } from "@/types/property";

export const SITE_NAME = "LivRank";
export const SITE_TAGLINE = "Know before you move to your new home";
export const SITE_DESCRIPTION =
  "Know before you move to your new home. Look up any Canadian address and read renter-reported reviews, ratings, and rent before you sign a lease. LivRank does not claim official rental history.";

export const HOME_FAQS: { question: string; answer: string }[] = [
  {
    question: "How do I know a rental before I move to my new home?",
    answer:
      "Look up any Canadian address on LivRank. If the building is already on file, you can read renter-reported reviews, ratings, and rent before you sign.",
  },
  {
    question: "Does LivRank cover all of Canada?",
    answer:
      "Yes. Search any Canadian address. If it is not on file yet, you can be the first to write a review or report the rent you paid.",
  },
  {
    question: "Are LivRank reviews official rental records?",
    answer:
      "No. Reviews and rent figures come from renters, not from a government registry or a landlord. LivRank does not claim official rental history.",
  },
  {
    question: "What if the building is not on LivRank yet?",
    answer:
      "Add it. Write a review or report what you paid so the next person can know before they move.",
  },
];

export function siteOrigin() {
  return appUrl();
}

export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function noIndexFollow(): Pick<Metadata, "robots"> {
  return { robots: { index: false, follow: false } };
}

export function provinceLabel(code: string) {
  return PROVINCE_NAMES[code as ProvinceCode] ?? code;
}

export function propertyDisplayName(property: Pick<Property, "building_name" | "address_line_1">) {
  return property.building_name?.replace(/\s*\(Demo\)\s*/gi, "").trim() || property.address_line_1;
}

export function propertyTitle(property: Pick<Property, "address_line_1" | "city" | "province">) {
  return `${property.address_line_1}, ${property.city} ${property.province}`;
}

export function propertyCanonicalPath(property: Pick<Property, "slug" | "id">) {
  return `/property/${property.slug || property.id}`;
}

export function exploreCanonicalPath(filters: { city?: string; province?: string }) {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.province) params.set("province", filters.province);
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

export function exploreHeading(filters: { city?: string; province?: string }) {
  if (filters.city && filters.province) return `Buildings on file in ${filters.city}, ${filters.province}`;
  if (filters.city) return `Buildings on file in ${filters.city}`;
  if (filters.province) return `Buildings on file in ${provinceLabel(filters.province)}`;
  return "Buildings on file";
}

export function exploreTitle(filters: { city?: string; province?: string }) {
  if (filters.city && filters.province) {
    return `Rental buildings in ${filters.city}, ${filters.province}`;
  }
  if (filters.city) return `Rental buildings in ${filters.city}`;
  if (filters.province) return `Rental buildings in ${provinceLabel(filters.province)}`;
  return "Explore rental buildings in Canada";
}

export function exploreDescription(
  filters: { city?: string; province?: string },
  buildingCount: number,
) {
  const place = filters.city
    ? filters.province
      ? `${filters.city}, ${filters.province}`
      : filters.city
    : filters.province
      ? provinceLabel(filters.province)
      : "Canada";
  const count =
    buildingCount > 0
      ? `${buildingCount} ${buildingCount === 1 ? "building" : "buildings"} on file. `
      : "";
  return `${count}Know before you move. Read renter-reported reviews and rent for buildings in ${place} before you sign. LivRank does not claim official rental history.`;
}

export function propertyDescription(input: {
  property: Pick<Property, "address_line_1" | "city" | "province" | "rent_report_count">;
  reviewCount: number;
  rating: number | null;
}) {
  const { property, reviewCount, rating } = input;
  const bits: string[] = [];
  if (reviewCount > 0) {
    bits.push(`${reviewCount} renter ${reviewCount === 1 ? "review" : "reviews"}`);
  }
  if (rating != null && reviewCount >= MIN_REVIEWS_FOR_RATING) {
    bits.push(`average ${rating.toFixed(1)} out of 5`);
  }
  if (property.rent_report_count > 0) bits.push("renter-reported rent on file");
  const facts = bits.length
    ? `${bits.join(", ").replace(/^./, (letter) => letter.toUpperCase())}. `
    : "No published ratings yet. ";
  return `Renter-reported file for ${property.address_line_1} in ${property.city}, ${property.province}. ${facts}Read renter reports before you move in. LivRank does not claim official rental history.`;
}

export function openGraphShare(
  title: string,
  description: string,
  path: string,
  extra?: { type?: "website" | "article" },
): NonNullable<Metadata["openGraph"]> {
  return {
    type: extra?.type ?? "website",
    locale: "en_CA",
    siteName: SITE_NAME,
    title,
    description,
    url: path,
  };
}

export function organizationJsonLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: origin,
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "Country", name: "Canada" },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[] = HOME_FAQS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function websiteJsonLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: origin,
    description: SITE_DESCRIPTION,
    inLanguage: "en-CA",
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function schemaTypeForProperty(property: Property) {
  if (property.property_type === "house") return "House";
  if (
    property.property_type === "townhouse" ||
    property.property_type === "duplex" ||
    property.property_type === "triplex" ||
    property.property_type === "fourplex"
  ) {
    return "Residence";
  }
  return "ApartmentComplex";
}

export function propertyJsonLd(input: {
  property: Property;
  reviewCount: number;
  rating: number | null;
  reviews: Array<{
    id: string;
    review_title: string;
    review_body: string;
    overall_rating: number;
    author_display_name?: string | null;
    published_at?: string | null;
    renter_status: string;
  }>;
}) {
  const { property, reviewCount, rating, reviews } = input;
  const origin = siteOrigin();
  const url = `${origin}${propertyCanonicalPath(property)}`;
  const name = propertyDisplayName(property);
  const type = schemaTypeForProperty(property);
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url,
    description: propertyDescription({ property, reviewCount, rating }),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address_line_1,
      addressLocality: property.city,
      addressRegion: property.province,
      postalCode: property.postal_code ?? undefined,
      addressCountry: "CA",
    },
  };
  if (property.property_type) {
    json.additionalType = PROPERTY_TYPE_LABELS[property.property_type];
  }
  if (property.latitude != null && property.longitude != null) {
    json.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }
  if (rating != null && reviewCount >= MIN_REVIEWS_FOR_RATING) {
    json.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  const reviewNodes = reviews.slice(0, 5).map((review) => ({
    "@type": "Review",
    name: review.review_title,
    reviewBody: review.review_body,
    datePublished: review.published_at ?? undefined,
    author: {
      "@type": "Person",
      name: review.author_display_name?.trim() || (review.renter_status === "former" ? "Former renter" : "Current renter"),
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.overall_rating,
      bestRating: 5,
      worstRating: 1,
    },
  }));
  if (reviewNodes.length) json.review = reviewNodes;
  return json;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}

export function rootMetadata(): Metadata {
  const origin = siteOrigin();
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return {
    metadataBase: new URL(origin),
    applicationName: SITE_NAME,
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "know before you move",
      "know before you rent",
      "apartment reviews Canada",
      "rental reviews Canada",
      "rental building reviews",
      "renter-reported rent",
      "apartment reviews",
    ],
    authors: [{ name: SITE_NAME, url: origin }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: "/" },
    openGraph: openGraphShare(`${SITE_NAME} — ${SITE_TAGLINE}`, SITE_DESCRIPTION, "/", {
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
    },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "Real Estate",
  };
}

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  extra?: Pick<Metadata, "robots">,
): Metadata {
  const ogTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphShare(ogTitle, description, path),
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
    ...extra,
  };
}

export function visibleRating(summary: Pick<RatingSummary, "overall" | "reviewCount">) {
  if (summary.overall == null || summary.reviewCount < MIN_REVIEWS_FOR_RATING) return null;
  return summary.overall;
}
