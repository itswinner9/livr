import Link from "next/link";
import { Stars } from "@/components/stars";
import { CompareToggle } from "@/components/compare-toggle";
import { PROPERTY_TYPE_LABELS, type Property, type PropertyType } from "@/types/property";
import { PROVINCE_NAMES, type ProvinceCode } from "@/lib/address/normalize";
import { itemFromProperty } from "@/lib/compare/ids";
import { formatCad, formatDate, cn } from "@/lib/utils";

export type ListingCardModel = {
  property: Property;
  rating: number | null;
  rent: { amount: number; year: number; bedrooms: number } | null;
};

export type ListingFacets = {
  cities: string[];
  provinces: string[];
  types: PropertyType[];
  cityCounts: Record<string, number>;
  cityPlaces: { city: string; province: string; count: number }[];
  buildingCount: number;
  reviewCount: number;
  rentReportCount: number;
};

export type ListingFiltersState = {
  q: string;
  city: string;
  province: string;
  propertyType: string;
  hasReviews: boolean;
  hasRent: boolean;
};

export function typeLabel(type: Property["property_type"]) {
  if (!type) return null;
  return PROPERTY_TYPE_LABELS[type];
}

export function displayName(property: Property) {
  return property.building_name?.replace(/\s*\(Demo\)\s*/gi, "").trim() || property.address_line_1;
}

export function propertyHref(property: Property) {
  return `/property/${property.slug || property.id}`;
}

export function listingHref(action: string, filters: ListingFiltersState, patch: Partial<ListingFiltersState>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.city) params.set("city", next.city);
  if (next.province) params.set("province", next.province);
  if (next.propertyType) params.set("type", next.propertyType);
  if (next.hasReviews) params.set("reviews", "1");
  if (next.hasRent) params.set("rent", "1");
  const query = params.toString();
  return query ? `${action}?${query}` : action;
}

export function scoreTone(value: number | null) {
  if (value == null) return "bg-star-dim";
  return "bg-star";
}

function chipClass(active: boolean) {
  return cn(
    "inline-flex min-h-11 shrink-0 items-center rounded-md border px-3.5 text-sm font-semibold",
    active
      ? "border-ink bg-surface text-ink"
      : "border-rule bg-paper text-mute hover:border-ink hover:text-ink",
  );
}

export function ListingFilters({
  action,
  filters,
  facets,
}: {
  action: string;
  filters: ListingFiltersState;
  facets: ListingFacets;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={listingHref(action, filters, { province: "" })} className={chipClass(!filters.province)}>
        All Canada
      </Link>
      {facets.provinces.map((province) => (
        <Link
          key={province}
          href={listingHref(action, filters, { province: filters.province === province ? "" : province })}
          className={chipClass(filters.province === province)}
          title={PROVINCE_NAMES[province as ProvinceCode] ?? province}
        >
          {province}
        </Link>
      ))}
      <Link href={listingHref(action, filters, { city: "" })} className={chipClass(!filters.city)}>
        All cities
      </Link>
      {facets.cities.map((city) => (
        <Link
          key={city}
          href={listingHref(action, filters, { city: filters.city === city ? "" : city })}
          className={chipClass(filters.city === city)}
        >
          {city}
        </Link>
      ))}
      <Link href={listingHref(action, filters, { propertyType: "" })} className={chipClass(!filters.propertyType)}>
        All types
      </Link>
      {facets.types.map((type) => (
        <Link
          key={type}
          href={listingHref(action, filters, { propertyType: filters.propertyType === type ? "" : type })}
          className={chipClass(filters.propertyType === type)}
        >
          {typeLabel(type)}
        </Link>
      ))}
      <Link href={listingHref(action, filters, { hasReviews: !filters.hasReviews })} className={chipClass(filters.hasReviews)}>
        Has reviews
      </Link>
      <Link href={listingHref(action, filters, { hasRent: !filters.hasRent })} className={chipClass(filters.hasRent)}>
        Has rent reports
      </Link>
      {filters.city || filters.province || filters.propertyType || filters.hasReviews || filters.hasRent || filters.q ? (
        <Link href={action} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-accent hover:text-accent-hover">
          Clear
        </Link>
      ) : null}
    </div>
  );
}

export function DossierCard({ row }: { row: ListingCardModel }) {
  const p = row.property;
  const width = row.rating == null ? 0 : Math.max(0, Math.min(100, (row.rating / 5) * 100));
  return (
    <article className="flex flex-col rounded-md bg-surface p-5 border border-rule">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink">
            <Link href={propertyHref(p)} className="hover:text-accent">
              {displayName(p)}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-mute">
            {p.address_line_1}, {p.city}, {p.province}
            {typeLabel(p.property_type) ? ` · ${typeLabel(p.property_type)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-ink">
            {row.rating != null ? row.rating.toFixed(1) : "—"}
            {row.rating != null ? <span className="text-sm font-medium text-mute"> / 5</span> : null}
          </p>
          {row.rating != null ? (
            <p className="mt-1">
              <Stars value={row.rating} showValue={false} label={`${row.rating.toFixed(1)} out of 5`} />
            </p>
          ) : null}
        </div>
      </div>
      {row.rating != null ? (
        <div className="mt-4 h-2.5 overflow-hidden rounded-sm bg-star-dim">
          <div className={cn("h-full rounded-sm", scoreTone(row.rating))} style={{ width: `${width}%` }} />
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 text-sm">
        <span className="text-mute">
          {row.rent ? (
            <>
              Reported rent <span className="figure font-semibold text-ink">{formatCad(row.rent.amount)}</span>
            </>
          ) : (
            "No rent reported"
          )}
        </span>
        <Link href={propertyHref(p)} className="font-semibold text-accent hover:text-accent-hover">
          View building
        </Link>
      </div>
      <div className="mt-3">
        <CompareToggle item={itemFromProperty(p)} />
      </div>
      <p className="mt-2 text-xs text-mute">
        <span className="figure text-ink">{p.review_count}</span> {p.review_count === 1 ? "review" : "reviews"}
        {p.last_review_date ? ` · Updated ${formatDate(p.last_review_date)}` : ""}
      </p>
    </article>
  );
}

export function SearchDossierCard({ row }: { row: ListingCardModel }) {
  const p = row.property;
  return (
    <article className="rounded-md bg-surface p-4 border border-rule">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">
            <Link href={propertyHref(p)} className="hover:text-accent">
              {displayName(p)}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-mute">
            {p.address_line_1}, {p.city}, {p.province}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-ink">
              {p.review_count} {p.review_count === 1 ? "review" : "reviews"}
            </span>
            {typeLabel(p.property_type) ? <span className="text-mute"> · {typeLabel(p.property_type)}</span> : null}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="figure text-lg font-bold leading-none text-ink">
            {row.rating != null ? row.rating.toFixed(1) : "—"}
            {row.rating != null ? <span className="text-xs font-medium text-mute"> /5</span> : null}
          </p>
          {row.rating != null ? (
            <p className="mt-1">
              <Stars value={row.rating} showValue={false} label={`${row.rating.toFixed(1)} out of 5`} />
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-muted p-2 text-center text-xs sm:grid-cols-3">
        <div>
          <span className="block text-mute">Rating</span>
          <span className="figure text-sm font-semibold text-ink">{row.rating != null ? row.rating.toFixed(1) : "—"}</span>
        </div>
        <div>
          <span className="block text-mute">Reviews</span>
          <span className="figure text-sm font-semibold text-ink">{p.review_count}</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="block text-mute">Reported rent</span>
          <span className="figure text-sm font-semibold text-ink">
            {row.rent ? formatCad(row.rent.amount) : "—"}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-mute">{row.rent ? "Latest renter-reported rent" : "No rent reported"}</span>
        <Link href={propertyHref(p)} className="text-sm font-bold text-accent hover:text-accent-hover">
          View full building profile
        </Link>
      </div>
    </article>
  );
}
