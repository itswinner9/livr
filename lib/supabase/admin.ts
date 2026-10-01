import { createClient } from "@supabase/supabase-js";
import { hasServiceRole, serviceRoleKey, supabaseUrl } from "@/lib/env";

export function createAdminClient() {
  if (!hasServiceRole() || !supabaseUrl()) return null;
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createSupabaseAdminClient = createAdminClient;
