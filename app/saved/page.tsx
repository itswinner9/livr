import { AccountShell } from "@/components/account-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getSavedProperties } from "@/lib/properties/queries";
import { PropertyCard } from "@/components/property-card";
import { EmptyState } from "@/components/empty-state";
import { SetHomeForm } from "@/components/today-forms";
import { getHomeProperty } from "@/lib/daily/queries";
import { noIndexFollow } from "@/lib/seo";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved buildings",
  ...noIndexFollow(),
};

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/saved");
  const [saved, home] = await Promise.all([getSavedProperties(user.id), getHomeProperty(user.id)]);
  return (
    <AccountShell>
      <div className="bg-paper py-8">
        <div className="dossier-wrap">
          <h1 className="display text-3xl text-ink">Saved buildings</h1>
          <p className="mt-2 text-sm text-mute">Buildings you bookmarked from a file.</p>
          {saved.length === 0 ? (
            <EmptyState
              title="No saved properties yet."
              description="Save a building from its property page to keep it here."
              action={
                <Link href="/explore" className="font-semibold text-accent hover:text-accent-hover">
                  Explore buildings
                </Link>
              }
            />
          ) : (
            <>
              <div className="mt-6 max-w-xl rounded-md border border-rule bg-surface p-4">
                <p className="text-sm font-semibold text-ink">I live here</p>
                <p className="mt-1 text-sm text-mute">Mark one saved building as home so Today can show your city pulse.</p>
                <SetHomeForm saved={saved} homeId={home?.id ?? null} />
              </div>
              <ul className="mt-6 space-y-4">
                {saved.map((p) => (
                  <li key={p.id}>
                    <PropertyCard property={p} />
                    {home?.id === p.id ? <p className="mt-2 text-xs font-semibold text-mute">Your home</p> : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
