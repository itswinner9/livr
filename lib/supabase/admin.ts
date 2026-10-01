import { createClient } from "@supabase/supabase-js";
import { hasServiceRole } from "@/lib/env";

export function createAdminClient() {
  if (!hasServiceRole() || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const createSupabaseAdminClient = createAdminClient;
