import Link from "next/link";
import { getAdminCounts } from "@/lib/admin/data";
import { hasServiceRole } from "@/lib/env";

const NAV = [
  { href: "/admin", label: "Overview", key: null },
  { href: "/admin/reviews", label: "Reviews", key: "pendingReviews" },
  { href: "/admin/rent-reports", label: "Rent reports", key: "pendingRent" },
  { href: "/admin/flags", label: "Flags", key: "flags" },
  { href: "/admin/properties", label: "Properties", key: null },
  { href: "/admin/users", label: "Users", key: null },
  { href: "/admin/managers", label: "Managers", key: null },
] as const;

export async function AdminChrome({ children }: { children: React.ReactNode }) {
  const counts = await getAdminCounts();
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit border border-rule bg-surface p-3 lg:sticky lg:top-6">
        <p className="px-3 pb-2 pt-1 text-sm font-medium text-ink">Admin</p>
        <nav className="flex flex-col gap-0.5" aria-label="Admin">
          {NAV.map((item) => {
            const count = item.key ? counts[item.key] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center justify-between px-3 py-2 text-sm text-ink hover:bg-muted"
              >
                {item.label}
                {count > 0 ? (
                  <span className="rounded-sm bg-accent/10 px-1.5 text-xs font-medium text-accent">{count}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        {!hasServiceRole() ? (
          <p className="mb-6 border border-accent/20 bg-accent/10 p-4 text-sm text-ink">
            Add SUPABASE_SERVICE_ROLE_KEY to enable auto-publish, audit logs, and some admin tools.
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
