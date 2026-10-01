import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AccountRentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = await createServerSupabase();
  const { data } = supabase
    ? await supabase
        .from("rent_reports")
        .select("id, monthly_rent, bedrooms, status")
        .eq("user_id", user.id)
    : { data: [] };
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">My rent reports</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {(data ?? []).map((r) => (
          <li key={r.id} className="rounded-md border bg-surface p-3">
            {r.bedrooms} bed · ${r.monthly_rent} · {r.status}
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No rent reports yet.</li> : null}
      </ul>
    </div>
  );
}
