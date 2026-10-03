import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

let client: SupabaseClient | null | undefined;

/** Cookie-free client for public tables. Safe to use inside cached reads. */
export function createPublicSupabase() {
  if (!hasSupabaseConfig()) return null;
  if (client !== undefined) return client;
  client = createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
