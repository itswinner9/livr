import { NextResponse, type NextRequest } from "next/server";
import { authReturnPath, googleCallbackUrl, publicRequestOrigin, type AuthIntent } from "@/lib/auth/oauth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-redirect";
import { continueToProvider, createRouteSupabase, redirectWithCookies } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const intent: AuthIntent = request.nextUrl.searchParams.get("intent") === "signup" ? "signup" : "login";
  const origin = publicRequestOrigin(request);
  const fail = new URL(authReturnPath(intent), `${origin}/`);
  fail.searchParams.set("error", "google");
  if (next !== "/account") fail.searchParams.set("next", next);

  const ip = await clientIp();
  if (!(await checkRateLimit("auth", ip))) {
    return NextResponse.redirect(fail);
  }

  const jar: Parameters<typeof redirectWithCookies>[1] = [];
  const supabase = createRouteSupabase(request, jar, origin);
  if (!supabase) {
    fail.searchParams.set("error", "auth");
    return NextResponse.redirect(fail);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: googleCallbackUrl(next, intent, origin),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return redirectWithCookies(fail, jar, origin);
  }

  return continueToProvider(data.url, jar, origin);
}
