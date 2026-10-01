import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export function createBrowserSupabase() {
  if (!hasSupabaseConfig()) return null;
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
