import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { submitManagerResponseForm, claimPropertyForm } from "@/lib/actions/forms";
import { redirect } from "next/navigation";

export default async function ManagerPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = await createServerSupabase();
  const { data: claims } = supabase
    ? await supabase.from("property_claims").select("*").eq("user_id", user.id)
    : { data: [] };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Property manager</h1>
      <p className="mt-2 text-sm text-mute">
        Claims stay unverified until a LivRank moderator approves them. Managers cannot edit renter
        reviews, ratings, or rent reports.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {(claims ?? []).map((c) => (
          <li key={c.id} className="rounded-md border bg-surface p-3">
            Property {c.property_id} · {c.verification_status}
          </li>
        ))}
        {(claims ?? []).length === 0 ? <li>No claimed properties yet.</li> : null}
      </ul>
      <form className="mt-6 space-y-2" action={claimPropertyForm}>
        <label className="text-sm font-medium">
          Claim property UUID
          <input name="propertyId" className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <button className="rounded-md bg-accent px-4 py-2 text-paper" type="submit">
          Submit claim
        </button>
      </form>
      <form action={submitManagerResponseForm} className="mt-8 space-y-2 rounded-md border bg-surface p-4">
        <h2 className="font-medium">Respond to a review</h2>
        <input name="propertyId" placeholder="Property ID" className="w-full rounded border px-3 py-2" />
        <input name="reviewId" placeholder="Review ID" className="w-full rounded border px-3 py-2" />
        <textarea name="response_body" rows={4} className="w-full rounded border px-3 py-2" />
        <button className="rounded bg-accent px-3 py-2 text-paper" type="submit">
          Publish response
        </button>
      </form>
    </div>
  );
}
