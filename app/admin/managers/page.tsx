import { getStaffClient } from "@/lib/admin/data";

export default async function AdminManagersPage() {
  const client = await getStaffClient();
  const { data } = client
    ? await client.from("property_claims").select("*").order("created_at", { ascending: false }).limit(50)
    : { data: [] };
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Manager claims</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {(data ?? []).map((claim) => (
          <li key={claim.id} className="rounded-md border bg-surface p-3">
            Property {claim.property_id.slice(0, 8)}… · {claim.verification_status}
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No claims.</li> : null}
      </ul>
    </div>
  );
}
