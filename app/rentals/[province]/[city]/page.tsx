import { CityDossier } from "@/components/city-dossier";
import { JsonLd } from "@/components/json-ld";
import { propertyHref } from "@/components/listing-ui";
import { getSessionUser } from "@/lib/auth/session";
import { resolveCityPlace } from "@/lib/daily/queries";
import { cityBuildingCount, loadCityMarketplace } from "@/lib/listings/page-data";
import {
  breadcrumbJsonLd,
  cityCanonicalPath,
  cityFaqs,
  exploreDescription,
  exploreTitle,
  faqJsonLd,
  itemListJsonLd,
  pageMetadata,
  propertyDisplayName,
  provinceExplorePath,
  provinceLabel,
} from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ province: string; city: string }>;
}): Promise<Metadata> {
  const { province, city } = await params;
  const place = await resolveCityPlace(province, city);
  if (!place) return { title: "City", robots: { index: false, follow: true } };
  const data = await loadCityMarketplace(place.city, place.province);
  const path = cityCanonicalPath(place);
  const buildingCount = cityBuildingCount(data.facets, place.city, place.province) || data.listings.length;
  return pageMetadata(exploreTitle(place), exploreDescription(place, buildingCount), path);
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ province: string; city: string }>;
}) {
  const { province, city } = await params;
  const place = await resolveCityPlace(province, city);
  if (!place) notFound();
  const [data, session] = await Promise.all([
    loadCityMarketplace(place.city, place.province),
    getSessionUser(),
  ]);
  const path = cityCanonicalPath(place);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: provinceLabel(place.province), path: provinceExplorePath(place.province) },
          { name: place.city, path: path },
        ])}
      />
      <JsonLd
        data={itemListJsonLd({
          name: exploreTitle(place),
          path,
          items: data.listings.map((row) => ({
            name: propertyDisplayName(row.property),
            path: propertyHref(row.property),
          })),
        })}
      />
      <JsonLd
        data={faqJsonLd(
          cityFaqs(
            place.city,
            place.province,
            data.listings
              .filter((row) => row.property.review_count > 0)
              .map((row) => propertyDisplayName(row.property)),
          ),
        )}
      />
      <CityDossier
        city={place.city}
        province={place.province}
        listings={data.listings}
        loggedIn={Boolean(session)}
      />
    </>
  );
}
