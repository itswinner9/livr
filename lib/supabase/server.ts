import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export const createServerSupabase = cache(async function createServerSupabase() {
  if (!hasSupabaseConfig()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; session refresh handled in proxy.
          }
        },
      },
    },
  );
});
