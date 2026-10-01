import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  if (!hasSupabaseConfig()) return response;

  // Server-action POSTs must keep content-type: text/x-component. Refreshing
  // the session (and rewriting cookies) on that reply can replace the body
  // and trigger Next.js E394 on the client. Actions refresh via createServerSupabase.
  if (request.headers.has("next-action") || request.headers.has("Next-Action")) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}
