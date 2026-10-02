import { getAdminCounts, listAdminProfiles } from "@/lib/admin/data";
import { AdminStatGrid } from "@/components/admin-stat-grid";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const [counts, rows] = await Promise.all([getAdminCounts(), listAdminProfiles()]);

  return (
    <div>
      <h1 className="display text-3xl text-ink">Users</h1>
      <p className="mt-2 text-sm text-mute">
        Total accounts in the livrank database. Emails are not listed here.
      </p>
      <AdminStatGrid
        items={[
          {
            href: "/admin/users",
            label: "Total users",
            value: counts.users,
            featured: true,
            hint: counts.users === 1 ? "1 account" : `${counts.users} accounts`,
          },
          { href: "/admin/users", label: "Renters", value: counts.renters },
          { href: "/admin/users", label: "Managers", value: counts.managers },
          { href: "/admin/users", label: "Staff", value: counts.staff },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No profiles found."
          description="If this stays empty while the total above is not zero, the staff session cannot read profiles."
        />
      ) : (
        <ul className="mt-6 overflow-hidden rounded-md border border-rule bg-surface">
          {rows.map((profile) => (
            <li
              key={profile.id}
              className="flex min-h-14 items-center justify-between gap-3 border-b border-rule px-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{profile.display_name || "Unnamed"}</p>
                <p className="text-sm text-mute">
                  {profile.created_at ? formatDate(profile.created_at) : ""} · {profile.id.slice(0, 8)}…
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge status={profile.role} />
                {profile.subscription_status && profile.subscription_status !== "free" ? (
                  <StatusBadge status={profile.subscription_status} />
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
      {counts.users > rows.length ? (
        <p className="mt-3 text-sm text-mute">
          Showing {rows.length} of {counts.users}.
        </p>
      ) : null}
    </div>
  );
}
