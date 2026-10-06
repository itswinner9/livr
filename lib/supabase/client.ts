import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export function createBrowserSupabase() {
  if (!hasSupabaseConfig()) return null;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  return createBrowserClient(supabaseUrl(), supabaseAnonKey(), {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure,
    },
  });
}
