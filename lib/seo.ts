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

export function propertyTitle(
  property: Pick<Property, "building_name" | "address_line_1" | "city" | "province">,
) {
  return `${propertyDisplayName(property)} reviews in ${property.city}, ${property.province}`;
}

export function propertyOgImagePath(property: Pick<Property, "slug" | "id">) {
  return `${propertyCanonicalPath(property)}/opengraph-image`;
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

export function placeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cityCanonicalPath(filters: { city: string; province: string }) {
  return `/rentals/${filters.province.toLowerCase()}/${placeSlug(filters.city)}`;
}

export function listingCanonicalPath(filters: { city?: string; province?: string }) {
  if (filters.city && filters.province) return cityCanonicalPath({ city: filters.city, province: filters.province });
  return exploreCanonicalPath(filters);
}

export function listingIsFiltered(filters: { propertyType?: string; hasReviews?: boolean; hasRent?: boolean }) {
  return Boolean(filters.propertyType || filters.hasReviews || filters.hasRent);
}

export function exploreCityRedirectPath(filters: {
  city?: string;
  province?: string;
  q?: string;
  propertyType?: string;
  hasReviews?: boolean;
  hasRent?: boolean;
}) {
  if (filters.q || listingIsFiltered(filters) || !filters.city || !filters.province) return null;
  return cityCanonicalPath({ city: filters.city, province: filters.province });
}

export function provinceExplorePath(province: string) {
  return `/explore?province=${encodeURIComponent(province)}`;
}

export function listedNames(names: string[], limit = 8) {
  const slice = names.map((name) => name.trim()).filter(Boolean).slice(0, limit);
  if (slice.length === 0) return "";
  if (slice.length === 1) return slice[0]!;
  if (slice.length === 2) return `${slice[0]} and ${slice[1]}`;
  return `${slice.slice(0, -1).join(", ")}, and ${slice[slice.length - 1]}`;
}

export function cityFaqs(city: string, province: string, buildingNames: string[] = []) {
  const place = `${city}, ${province}`;
  const named = listedNames(buildingNames);
  const faqs = [
    {
      question: `How do I know a rental in ${place} before I move?`,
      answer: `Look up the address on LivRank. If the building is on file, you can read renter-reported reviews, ratings, and rent for ${place} before you sign.`,
    },
    {
      question: `Are LivRank figures for ${place} official rental records?`,
      answer:
        "No. Reviews and rent figures come from renters, not from a government registry or a landlord. LivRank does not claim official rental history.",
    },
    {
      question: `What if my building in ${place} is not on LivRank yet?`,
      answer: "Add it. Write a review or report what you paid so the next person can know before they move.",
    },
  ];
  if (named) {
    faqs.splice(1, 0, {
      question: `Which ${city} buildings have renter reviews on LivRank?`,
      answer: `Buildings on file include ${named}. Open a building page to read the published renter reviews.`,
    });
  }
  return faqs;
}

export function propertyFaqs(
  property: Pick<Property, "building_name" | "address_line_1" | "city" | "province" | "postal_code">,
  stats: { reviewCount: number; rating: number | null },
) {
  const name = propertyDisplayName(property);
  const where = [property.address_line_1, property.city, property.province, property.postal_code]
    .filter(Boolean)
    .join(", ");
  const reviewsLabel = `${stats.reviewCount} published renter ${stats.reviewCount === 1 ? "review" : "reviews"}`;
  const say =
    stats.reviewCount > 0
      ? stats.rating != null && stats.reviewCount >= MIN_REVIEWS_FOR_RATING
        ? `${reviewsLabel}, average ${stats.rating.toFixed(1)} out of 5. Read the reviews on this page.`
        : `${reviewsLabel}. Read the reviews on this page.`
      : `No published renter reviews yet. Be the first to write one on this page.`;
  return [
    {
      question: `What do renters say about ${name}?`,
      answer: say,
    },
    {
      question: `Where is ${name}?`,
      answer: `${name} is at ${where}.`,
    },
    {
      question: `Are LivRank reviews of ${name} official rental records?`,
      answer:
        "No. Reviews and rent figures come from renters, not from a government registry or a landlord. LivRank does not claim official rental history.",
    },
  ];
}

export function exploreHeading(filters: { city?: string; province?: string }) {
  if (filters.city && filters.province) return `Building reviews in ${filters.city}, ${filters.province}`;
  if (filters.city) return `Building reviews in ${filters.city}`;
  if (filters.province) return `Building reviews in ${provinceLabel(filters.province)}`;
  return "Building reviews";
}

export function exploreTitle(filters: { city?: string; province?: string }) {
  if (filters.city && filters.province) {
    return `Renter reviews of buildings in ${filters.city}, ${filters.province}`;
  }
  if (filters.city) return `Renter reviews of buildings in ${filters.city}`;
  if (filters.province) return `Renter reviews of buildings in ${provinceLabel(filters.province)}`;
  return "Explore rental building reviews in Canada";
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
  return `${count}Read renter reviews of buildings in ${place} before you sign. LivRank does not claim official rental history.`;
}

export function propertyDescription(input: {
  property: Pick<Property, "building_name" | "address_line_1" | "city" | "province" | "rent_report_count">;
  reviewCount: number;
  rating: number | null;
}) {
  const { property, reviewCount, rating } = input;
  const name = propertyDisplayName(property);
  const place =
    name === property.address_line_1
      ? `in ${property.city}, ${property.province}`
      : `at ${property.address_line_1}, ${property.city}, ${property.province}`;
  if (reviewCount < 1) {
    return `No published ratings yet for ${name} ${place}. Read renter reports before you move in. LivRank does not claim official rental history.`;
  }
  const reviewBit = `Read ${reviewCount} renter ${reviewCount === 1 ? "review" : "reviews"} of ${name} ${place}.`;
  const ratingBit =
    rating != null && reviewCount >= MIN_REVIEWS_FOR_RATING ? ` Average ${rating.toFixed(1)} out of 5.` : "";
  const rentBit = property.rent_report_count > 0 ? " Renter-reported rent on file." : "";
  return `${reviewBit}${ratingBit}${rentBit} LivRank does not claim official rental history.`;
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
  if (property.property_type === "house") return ["LocalBusiness", "House"];
  if (
    property.property_type === "townhouse" ||
    property.property_type === "duplex" ||
    property.property_type === "triplex" ||
    property.property_type === "fourplex"
  ) {
    return ["LocalBusiness", "Residence"];
  }
  return ["LocalBusiness", "ApartmentComplex"];
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
    image: `${origin}${propertyOgImagePath(property)}`,
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
  const named = property.building_name?.replace(/\s*\(Demo\)\s*/gi, "").trim();
  if (named && named !== property.address_line_1) {
    json.alternateName = property.address_line_1;
  }
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

export function itemListJsonLd(input: {
  name: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: `${origin}${input.path}`,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${origin}${item.path}`,
    })),
  };
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
