import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

function cookieOptions(origin: string) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: origin.startsWith("https://"),
  };
}

function isProviderUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && (parsed.hostname.endsWith(".supabase.co") || parsed.hostname === "accounts.google.com");
  } catch {
    return false;
  }
}

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function applyCookies(response: NextResponse, jar: CookieToSet[], origin?: string) {
  const extras = origin ? cookieOptions(origin) : null;
  for (const { name, value, options } of jar) {
    response.cookies.set(name, value, extras ? { ...options, ...extras } : options);
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function createRouteSupabase(request: NextRequest, jar: CookieToSet[], origin?: string) {
  if (!hasSupabaseConfig()) return null;
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookieOptions: origin ? cookieOptions(origin) : undefined,
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

export function redirectWithCookies(url: string | URL, jar: CookieToSet[], origin?: string) {
  return applyCookies(NextResponse.redirect(url), jar, origin);
}

export function continueToProvider(url: string, jar: CookieToSet[], origin: string) {
  if (!isProviderUrl(url)) {
    return applyCookies(NextResponse.redirect(new URL("/login?error=google", `${origin}/`)), jar, origin);
  }
  const safe = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safe}"><title>Continue with Google</title></head><body><p><a href="${safe}">Continue with Google</a></p><script>location.replace(${JSON.stringify(url)})</script></body></html>`;
  return applyCookies(
    new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    jar,
    origin,
  );
}
