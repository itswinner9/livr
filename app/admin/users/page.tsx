import { getStaffClient } from "@/lib/admin/data";

export default async function AdminUsersPage() {
  const client = await getStaffClient();
  const { data } = client
    ? await client.from("profiles").select("id, display_name, role, created_at").limit(100)
    : { data: [] };
  return (
    <div>
      <h1 className="text-3xl font-semibold text-ink">Users</h1>
      <p className="mt-2 text-sm text-mute">Emails are not listed here.</p>
      <ul className="mt-4 space-y-2 text-sm">
        {(data ?? []).map((profile) => (
          <li key={profile.id} className="rounded-md border bg-surface p-3">
            {profile.display_name || "Unnamed"} · {profile.role} · {profile.id.slice(0, 8)}…
          </li>
        ))}
      </ul>
    </div>
  );
}
