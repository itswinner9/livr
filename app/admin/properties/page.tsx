import { getAdminCounts, getStaffClient } from "@/lib/admin/data";
import { mergePropertiesForm } from "@/lib/actions/forms";
import { AdminPropertyActions } from "@/components/admin-property-actions";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminPropertiesPage() {
  const [counts, client] = await Promise.all([getAdminCounts(), getStaffClient()]);
  const { data } = client
    ? await client
        .from("properties")
        .select("id, address_line_1, city, province, slug, is_demo, status")
        .order("updated_at", { ascending: false })
        .limit(100)
    : { data: [] };
  const rows = data ?? [];
  return (
    <div>
      <h1 className="display text-3xl text-ink">Properties</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        {counts.properties} {counts.properties === 1 ? "building" : "buildings"} on file. Remove hides a building from
        Explore. Delete is permanent. Do not delete a live file unless it is spam.
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No properties found." />
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((property) => (
            <li key={property.id} className="rounded-md border border-rule bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/property/${property.slug || property.id}`} className="font-semibold text-ink hover:text-accent">
                  {property.address_line_1}, {property.city} {property.province}
                </Link>
                <span className="flex items-center gap-2">
                  <StatusBadge status={property.status} />
                  {property.is_demo ? <StatusBadge status="demo" /> : null}
                </span>
              </div>
              <AdminPropertyActions propertyId={property.id} status={property.status} />
            </li>
          ))}
        </ul>
      )}
      <Card className="mt-8">
        <h2 className="text-xl font-bold text-ink">Merge duplicates</h2>
        <form action={mergePropertiesForm} className="mt-4 space-y-3">
          <Input name="canonical" placeholder="Canonical property UUID" />
          <Input name="duplicate" placeholder="Duplicate property UUID" />
          <Button type="submit">Merge</Button>
        </form>
      </Card>
    </div>
  );
}
