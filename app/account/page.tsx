import { getSessionUser } from "@/lib/auth/session";
import { updateProfileForm, signOutForm, deleteAccountForm } from "@/lib/actions/forms";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = await createServerSupabase();
  const { data: reviews } = supabase
    ? await supabase.from("reviews").select("id, review_title, status, created_at").eq("user_id", user.id)
    : { data: [] };
  const { data: rents } = supabase
    ? await supabase.from("rent_reports").select("id, monthly_rent, status, created_at").eq("user_id", user.id)
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Account</h1>
      <section>
        <h2 className="font-medium">Profile</h2>
        <p className="mt-1 text-sm text-mute">Role and subscription are not editable here.</p>
        <form action={updateProfileForm} className="mt-3 space-y-3">
          <label className="block text-sm">
            Display name
            <input
              name="display_name"
              defaultValue={user.display_name ?? ""}
              className="mt-1.5 w-full rounded-sm border border-rule bg-surface px-3 py-2.5 text-sm"
            />
          </label>
          <button className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-paper hover:bg-accent-hover" type="submit">
            Save
          </button>
        </form>
        <p className="mt-3 text-sm text-mute">Plan: {user.subscription_status}</p>
      </section>
      <section className="border-t border-rule pt-6">
        <h2 className="font-medium">My reviews</h2>
        <ul className="mt-2 text-sm">
          {(reviews ?? []).map((r) => (
            <li key={r.id}>
              {r.review_title} · {r.status}
            </li>
          ))}
          {(reviews ?? []).length === 0 ? <li>No reviews yet.</li> : null}
        </ul>
        <Link className="mt-2 inline-block text-sm text-accent" href="/account/reviews">
          View all
        </Link>
      </section>
      <section className="border-t border-rule pt-6">
        <h2 className="font-medium">My rent reports</h2>
        <ul className="mt-2 text-sm">
          {(rents ?? []).map((r) => (
            <li key={r.id}>
              ${r.monthly_rent} · {r.status}
            </li>
          ))}
          {(rents ?? []).length === 0 ? <li>No rent reports yet.</li> : null}
        </ul>
        <Link className="mt-2 inline-block text-sm text-accent" href="/account/rent-reports">
          View all
        </Link>
      </section>
      <section className="border-t border-rule pt-6">
        <h2 className="font-medium">Saved properties</h2>
        <Link className="text-sm text-accent" href="/saved">
          Open saved
        </Link>
      </section>
      <section className="border-t border-rule pt-6">
        <h2 className="font-medium">Notifications & privacy</h2>
        <p className="text-sm text-mute">
          Email preferences are stored when the database is configured. You can request deletion,
          which clears your public display name. Published reviews may remain as Former renter
          content for property history.
        </p>
      </section>
      <form action={signOutForm}>
        <button className="min-h-11 rounded-md border border-rule bg-surface px-4 text-sm font-medium text-ink hover:bg-muted" type="submit">
          Log out
        </button>
      </form>
      <form action={deleteAccountForm}>
        <button className="text-sm text-destructive underline" type="submit">
          Delete account
        </button>
      </form>
    </div>
  );
}
