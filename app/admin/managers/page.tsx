import { getStaffClient } from "@/lib/admin/data";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function AdminManagersPage() {
  const client = await getStaffClient();
  const { data } = client
    ? await client.from("property_claims").select("*").order("created_at", { ascending: false }).limit(50)
    : { data: [] };
  const rows = data ?? [];
  return (
    <div>
      <h1 className="display text-3xl text-ink">Manager claims</h1>
      <p className="mt-2 text-sm text-mute">People asking to manage a building file.</p>
      {rows.length === 0 ? (
        <EmptyState title="No claims." />
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((claim) => (
            <li key={claim.id} className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-rule bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Property {String(claim.property_id).slice(0, 8)}…</p>
                <p className="text-sm text-mute">{claim.created_at ? formatDate(claim.created_at) : ""}</p>
              </div>
              <StatusBadge status={claim.verification_status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
