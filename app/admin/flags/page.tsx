import { getStaffClient } from "@/lib/admin/data";

export default async function AdminFlagsPage() {
  const client = await getStaffClient();
  const { data } = client ? await client.from("review_flags").select("*").eq("status", "open").limit(50) : { data: [] };
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Flags</h1>
      <ul className="mt-6 space-y-3 text-sm">
        {(data ?? []).map((flag) => (
          <li key={flag.id} className="rounded-md border bg-surface p-4">
            {flag.reason} · review {flag.review_id}
            {flag.details ? <p className="mt-1">{flag.details}</p> : null}
          </li>
        ))}
        {(data ?? []).length === 0 ? <li>No open flags.</li> : null}
      </ul>
    </div>
  );
}
