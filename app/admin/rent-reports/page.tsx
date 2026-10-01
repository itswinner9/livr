import { getStaffClient } from "@/lib/admin/data";
import { ModerationButtons } from "@/components/admin-table";

export default async function AdminRentPage() {
  const client = await getStaffClient();
  const { data } = client
    ? await client
        .from("rent_reports")
        .select("id, monthly_rent, bedrooms, status, property_id, created_at")
        .eq("status", "pending")
        .limit(50)
    : { data: [] };
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Pending rent reports</h1>
      <ul className="mt-6 space-y-3">
        {(data ?? []).map((report) => (
          <li key={report.id} className="rounded-md border bg-surface p-4">
            <p>
              {report.bedrooms} bed · ${report.monthly_rent}
            </p>
            <div className="mt-2">
              <ModerationButtons
                targetType="rent_report"
                targetId={report.id}
                actions={["approve", "reject", "hide", "delete"]}
              />
            </div>
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No pending rent reports.</li> : null}
      </ul>
    </div>
  );
}
