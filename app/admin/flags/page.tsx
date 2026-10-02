import { getAdminCounts, getStaffClient } from "@/lib/admin/data";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";

export default async function AdminFlagsPage() {
  const [counts, client] = await Promise.all([getAdminCounts(), getStaffClient()]);
  const { data } = client
    ? await client.from("review_flags").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50)
    : { data: [] };
  const rows = data ?? [];
  return (
    <div>
      <h1 className="display text-3xl text-ink">Flags</h1>
      <p className="mt-2 text-sm text-mute">
        {counts.flags} open {counts.flags === 1 ? "report" : "reports"} from renters.
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No open flags." />
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((flag) => (
            <li key={flag.id} className="rounded-md border border-rule bg-surface p-4">
              <p className="font-semibold text-ink">{flag.reason}</p>
              <p className="mt-1 text-sm text-mute">
                Review {String(flag.review_id).slice(0, 8)}…
                {flag.created_at ? ` · ${formatDate(flag.created_at)}` : ""}
              </p>
              {flag.details ? <p className="mt-2 text-sm text-ink">{flag.details}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
