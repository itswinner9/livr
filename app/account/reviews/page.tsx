import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AccountReviewsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = await createServerSupabase();
  const { data } = supabase
    ? await supabase.from("reviews").select("id, review_title, status, created_at").eq("user_id", user.id)
    : { data: [] };
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">My reviews</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {(data ?? []).map((r) => (
          <li key={r.id} className="rounded-md border bg-surface p-3">
            {r.review_title} · {r.status}
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No reviews yet.</li> : null}
      </ul>
    </div>
  );
}
