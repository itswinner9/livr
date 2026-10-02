import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getStaffClient(): Promise<SupabaseClient | null> {
  return createAdminClient() ?? (await createServerSupabase());
}

export type AdminCounts = {
  pendingReviews: number;
  pendingReplies: number;
  publishedReviews: number;
  pendingRent: number;
  rentReports: number;
  flags: number;
  properties: number;
  users: number;
  renters: number;
  managers: number;
  staff: number;
};

const EMPTY_COUNTS: AdminCounts = {
  pendingReviews: 0,
  pendingReplies: 0,
  publishedReviews: 0,
  pendingRent: 0,
  rentReports: 0,
  flags: 0,
  properties: 0,
  users: 0,
  renters: 0,
  managers: 0,
  staff: 0,
};

function counted(where: string, result: { count: number | null; error: { message: string } | null }) {
  if (result.error) console.error(`[admin] ${where}: ${result.error.message}`);
  return result.count ?? 0;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const client = await getStaffClient();
  if (!client) return EMPTY_COUNTS;

  const [properties, publishedReviews, pendingReviews, pendingReplies, rentReports, pendingRent, flags, profileCounts] =
    await Promise.all([
      client.from("properties").select("id", { count: "exact", head: true }),
      client.from("reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
      client.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      client.from("review_replies").select("id", { count: "exact", head: true }).eq("status", "pending"),
      client.from("rent_reports").select("id", { count: "exact", head: true }).eq("status", "published"),
      client.from("rent_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      client.from("review_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      client.rpc("staff_profile_counts"),
    ]);

  if (profileCounts.error) console.error(`[admin] staff_profile_counts: ${profileCounts.error.message}`);
  const row = Array.isArray(profileCounts.data) ? profileCounts.data[0] : profileCounts.data;
  let users = Number(row?.total ?? 0);
  let renters = Number(row?.renters ?? 0);
  let managers = Number(row?.managers ?? 0);
  let staff = Number(row?.staff ?? 0);
  if (profileCounts.error || !row) {
    const fallback = await client.from("profiles").select("role", { count: "exact" });
    if (fallback.error) console.error(`[admin] profiles: ${fallback.error.message}`);
    const roles = fallback.data ?? [];
    users = fallback.count ?? roles.length;
    renters = roles.filter((profile) => profile.role === "user").length;
    managers = roles.filter((profile) => profile.role === "manager").length;
    staff = roles.filter((profile) => profile.role === "admin" || profile.role === "moderator").length;
  }

  return {
    properties: counted("properties", properties),
    publishedReviews: counted("publishedReviews", publishedReviews),
    pendingReviews: counted("pendingReviews", pendingReviews),
    pendingReplies: counted("pendingReplies", pendingReplies),
    rentReports: counted("rentReports", rentReports),
    pendingRent: counted("pendingRent", pendingRent),
    flags: counted("flags", flags),
    users,
    renters,
    managers,
    staff,
  };
}

export type AdminProfileRow = {
  id: string;
  display_name: string | null;
  role: string;
  subscription_status: string | null;
  created_at: string | null;
};

export async function listAdminProfiles(limit = 200): Promise<AdminProfileRow[]> {
  const client = await getStaffClient();
  if (!client) return [];
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, role, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) console.error(`[admin] list profiles: ${error.message}`);
  return (data ?? []) as AdminProfileRow[];
}
