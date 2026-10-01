import { PropertyMap } from "@/components/maps/property-map";
import type { ContributionProperty } from "@/lib/properties/queries";

export function ContributionHeader({
  property,
  mapToken,
}: {
  property: ContributionProperty;
  mapToken: string | null;
}) {
  return (
    <div className="mt-6 border-y border-rule py-4">
      <PropertyMap
        pins={[
          {
            id: property.id,
            latitude: property.latitude,
            longitude: property.longitude,
            label: property.address_line_1,
          },
        ]}
        token={mapToken}
        zoom={16}
        interactive={false}
        className="h-36 border border-rule"
      />
      <div className="mt-4">
        <p className="font-medium text-ink">
          {property.address_line_1}
          {property.building_name ? ` · ${property.building_name}` : ""}
        </p>
        <p className="text-sm text-mute">
          {property.city}, {property.province} {property.postal_code ?? ""}
        </p>
        {property.status === "pending" ? (
          <p className="mt-2 text-xs text-mute">
            New address. Its page will appear publicly once the first review or rent report is approved.
          </p>
        ) : null}
      </div>
    </div>
  );
}
