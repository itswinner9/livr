import { hasServiceRole } from "@/lib/env";
import { getAdminCounts } from "@/lib/admin/data";
import { AdminNav } from "@/components/admin-nav";
import Link from "next/link";

export async function AdminChrome({ children }: { children: React.ReactNode }) {
  const counts = await getAdminCounts();
  return (
    <div className="w-full bg-paper">
      <div className="dossier-wrap grid gap-6 py-6 lg:grid-cols-12 lg:py-8">
        <aside className="h-fit rounded-md border border-rule bg-surface p-3 lg:sticky lg:top-24 lg:col-span-3">
          <p className="px-3 pb-1 pt-1 text-sm font-semibold text-ink">Admin</p>
          <Link href="/admin/users" className="mb-3 block rounded-md bg-muted px-3 py-3 hover:bg-paper">
            <p className="text-xs font-medium text-mute">Total users</p>
            <p className="mt-1 text-4xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
              {counts.users}
            </p>
          </Link>
          <AdminNav counts={counts} />
        </aside>
        <div className="min-w-0 lg:col-span-9">
          {!hasServiceRole() ? (
            <p className="mb-6 rounded-md border border-rule bg-muted px-4 py-3 text-sm text-ink">
              Add SUPABASE_SERVICE_ROLE_KEY so auto-publish, audit logs, and some admin tools can run.
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
