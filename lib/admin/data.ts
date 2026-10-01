import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getStaffClient(): Promise<SupabaseClient | null> {
  return createAdminClient() ?? (await createServerSupabase());
}

export type AdminCounts = {
  pendingReviews: number;
  publishedReviews: number;
  pendingRent: number;
  rentReports: number;
  flags: number;
  properties: number;
  users: number;
};

const EMPTY_COUNTS: AdminCounts = {
  pendingReviews: 0,
  publishedReviews: 0,
  pendingRent: 0,
  rentReports: 0,
  flags: 0,
  properties: 0,
  users: 0,
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const client = await getStaffClient();
  if (!client) return EMPTY_COUNTS;
  const [properties, publishedReviews, pendingReviews, rentReports, pendingRent, flags, users] = await Promise.all([
    client.from("properties").select("id", { count: "exact", head: true }),
    client.from("reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
    client.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("rent_reports").select("id", { count: "exact", head: true }).eq("status", "published"),
    client.from("rent_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("review_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
    client.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    properties: properties.count ?? 0,
    publishedReviews: publishedReviews.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    rentReports: rentReports.count ?? 0,
    pendingRent: pendingRent.count ?? 0,
    flags: flags.count ?? 0,
    users: users.count ?? 0,
  };
}
