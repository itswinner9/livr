import Link from "next/link";
import type { Property } from "@/types/property";

export function PropertyCard({
  property,
  rating,
}: {
  property: Property;
  rating?: number | null;
}) {
  const href = `/property/${property.slug || property.id}`;
  const type = property.property_type ? property.property_type.replace("_", " ") : null;
  return (
    <Link href={href} className="group flex items-baseline justify-between gap-6 border-b border-rule py-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink group-hover:text-accent">{property.address_line_1}</h2>
        <p className="mt-0.5 text-sm text-mute">
          {property.city}, {property.province}
          {property.postal_code ? ` ${property.postal_code}` : ""}
          {type ? ` · ${type}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="figure text-lg text-ink">{rating != null ? rating.toFixed(1) : "—"}</p>
        <p className="mt-0.5 text-xs text-mute">
          {property.review_count} {property.review_count === 1 ? "review" : "reviews"}
          <span> · </span>
          {property.rent_report_count} rent {property.rent_report_count === 1 ? "report" : "reports"}
        </p>
      </div>
    </Link>
  );
}
