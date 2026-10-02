import { getAdminCounts } from "@/lib/admin/data";
import { AdminStatGrid } from "@/components/admin-stat-grid";
import Link from "next/link";

export default async function AdminHome() {
  const counts = await getAdminCounts();
  return (
    <div>
      <h1 className="display text-3xl text-ink">Admin</h1>
      <p className="mt-2 text-sm text-mute">Queue first. Totals are the live LivRank database.</p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-mute">Users</h2>
      <AdminStatGrid
        items={[
          {
            href: "/admin/users",
            label: "Total users",
            value: counts.users,
            featured: true,
            hint: counts.users === 1 ? "1 account on file" : `${counts.users} accounts on file`,
          },
          { href: "/admin/users", label: "Renters", value: counts.renters },
          { href: "/admin/users", label: "Managers", value: counts.managers },
          { href: "/admin/users", label: "Staff", value: counts.staff },
        ]}
      />
      <p className="mt-3 text-sm text-mute">
        <Link href="/admin/users" className="font-semibold text-accent hover:text-accent-hover">
          Open the user list
        </Link>
        {" · "}
        Emails stay off this dashboard.
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-mute">Needs attention</h2>
      <AdminStatGrid
        items={[
          { href: "/admin/reviews", label: "Reviews waiting", value: counts.pendingReviews },
          { href: "/admin/reviews?tab=replies", label: "Replies waiting", value: counts.pendingReplies },
          { href: "/admin/rent-reports", label: "Rent waiting", value: counts.pendingRent },
          { href: "/admin/flags", label: "Open flags", value: counts.flags },
        ]}
      />

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-mute">On file</h2>
      <AdminStatGrid
        items={[
          { href: "/admin/properties", label: "Properties", value: counts.properties },
          { href: "/admin/reviews?tab=published", label: "Published reviews", value: counts.publishedReviews },
          { href: "/admin/rent-reports", label: "Published rent", value: counts.rentReports },
        ]}
      />
    </div>
  );
}
