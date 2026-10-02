import { getAdminCounts, getStaffClient } from "@/lib/admin/data";
import { ModerationButtons } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { formatCad, formatDate } from "@/lib/utils";

export default async function AdminRentPage() {
  const [counts, client] = await Promise.all([getAdminCounts(), getStaffClient()]);
  const { data } = client
    ? await client
        .from("rent_reports")
        .select("id, monthly_rent, bedrooms, status, property_id, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50)
    : { data: [] };
  const rows = data ?? [];
  return (
    <div>
      <h1 className="display text-3xl text-ink">Pending rent reports</h1>
      <p className="mt-2 text-sm text-mute">
        {counts.pendingRent} waiting. These do not change a building’s star rating.
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No pending rent reports." />
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((report) => (
            <li key={report.id} className="rounded-md border border-rule bg-surface p-4">
              <p className="font-semibold text-ink">
                {formatCad(Number(report.monthly_rent))}
                <span className="ml-2 text-sm font-medium text-mute">
                  {report.bedrooms === 0 ? "Studio" : `${report.bedrooms} bedroom`}
                </span>
              </p>
              <p className="mt-1 text-sm text-mute">
                {report.created_at ? formatDate(report.created_at) : ""} · {String(report.property_id).slice(0, 8)}…
              </p>
              <div className="mt-3">
                <ModerationButtons
                  targetType="rent_report"
                  targetId={report.id}
                  actions={["approve", "reject", "hide", "delete"]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
