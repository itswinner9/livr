import { AccountShell } from "@/components/account-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getSavedProperties } from "@/lib/properties/queries";
import { PropertyCard } from "@/components/property-card";
import { EmptyState } from "@/components/empty-state";
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
  const saved = await getSavedProperties(user.id);
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
            <ul className="mt-6 space-y-4">
              {saved.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
