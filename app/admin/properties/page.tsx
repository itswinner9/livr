import { getStaffClient } from "@/lib/admin/data";
import { mergePropertiesForm } from "@/lib/actions/forms";
import { AdminPropertyActions } from "@/components/admin-property-actions";
import Link from "next/link";

export default async function AdminPropertiesPage() {
  const client = await getStaffClient();
  const { data } = client
    ? await client
        .from("properties")
        .select("id, address_line_1, city, province, slug, is_demo, status")
        .order("updated_at", { ascending: false })
        .limit(100)
    : { data: [] };
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Properties</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Remove hides a building from Explore. Delete is permanent. Do not delete a live file unless it is spam.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {(data ?? []).map((property) => (
          <li key={property.id} className="rounded-md border bg-surface p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/property/${property.slug || property.id}`} className="font-medium text-ink hover:text-accent">
                {property.address_line_1}, {property.city} {property.province}
              </Link>
              <p className="text-xs text-mute">
                {property.status}
                {property.is_demo ? " · demo" : ""}
              </p>
            </div>
            <AdminPropertyActions propertyId={property.id} status={property.status} />
          </li>
        ))}
      </ul>
      <form action={mergePropertiesForm} className="mt-8 space-y-2 rounded-md border bg-surface p-4">
        <h2 className="font-medium">Merge duplicates</h2>
        <input name="canonical" placeholder="Canonical property UUID" className="w-full rounded border px-3 py-2" />
        <input name="duplicate" placeholder="Duplicate property UUID" className="w-full rounded border px-3 py-2" />
        <button className="rounded bg-accent px-3 py-2 text-paper" type="submit">
          Merge
        </button>
      </form>
    </div>
  );
}
