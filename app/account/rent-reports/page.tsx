import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatCad, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My rent reports" };

export default async function AccountRentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/rent-reports");
  const supabase = await createServerSupabase();
  const { data } = supabase
    ? await supabase
        .from("rent_reports")
        .select("id, monthly_rent, bedrooms, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const rows = data ?? [];

  return (
    <div className="bg-paper py-8">
      <div className="dossier-wrap">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-3xl text-ink">My rent reports</h1>
            <p className="mt-2 text-sm text-mute">Rents you reported. These never change a building’s star rating.</p>
          </div>
          <Link
            href="/rate?intent=rent"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-paper hover:bg-accent-hover"
          >
            Report rent
          </Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="No rent reports yet."
            description="Add the rent you paid so the next renter can see a real number."
            action={
              <Link href="/rate?intent=rent" className="font-semibold text-accent hover:text-accent-hover">
                Report rent
              </Link>
            }
          />
        ) : (
          <ul className="mt-6 overflow-hidden rounded-md border border-rule bg-surface">
            {rows.map((report) => (
              <li key={report.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-rule px-4 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{formatCad(Number(report.monthly_rent))}</p>
                  <p className="text-sm text-mute">
                    {report.bedrooms === 0 ? "Studio" : `${report.bedrooms} bedroom`}
                    {report.created_at ? ` · ${formatDate(report.created_at)}` : ""}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
