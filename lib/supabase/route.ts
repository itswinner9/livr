import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export function createRouteSupabase(request: NextRequest, jar: CookieToSet[]) {
  if (!hasSupabaseConfig()) return null;
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        jar.push(...cookiesToSet);
      },
    },
  });
}

export function redirectWithCookies(url: string | URL, jar: CookieToSet[]) {
  const response = NextResponse.redirect(url);
  for (const { name, value, options } of jar) {
    response.cookies.set(name, value, options);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
