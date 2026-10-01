import { getSessionUser } from "@/lib/auth/session";
import { getSavedProperties } from "@/lib/properties/queries";
import { PropertyCard } from "@/components/property-card";
import { EmptyState } from "@/components/empty-state";
import { noIndexFollow } from "@/lib/seo";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved buildings",
  ...noIndexFollow(),
};

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const saved = await getSavedProperties(user.id);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Saved properties</h1>
      {saved.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No saved properties yet." description="Save a building from its property page." />
        </div>
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
  );
}
