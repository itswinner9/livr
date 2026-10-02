import { NextResponse } from "next/server";
import { authReturnPath, googleCallbackUrl, publicRequestOrigin, type AuthIntent } from "@/lib/auth/oauth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-redirect";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const intent: AuthIntent = searchParams.get("intent") === "signup" ? "signup" : "login";
  const fail = new URL(authReturnPath(intent), `${publicRequestOrigin(request)}/`);
  fail.searchParams.set("error", "google");
  if (next !== "/account") fail.searchParams.set("next", next);

  const ip = await clientIp();
  if (!(await checkRateLimit("auth", ip))) {
    return NextResponse.redirect(fail);
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    fail.searchParams.set("error", "auth");
    return NextResponse.redirect(fail);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: googleCallbackUrl(next, intent, publicRequestOrigin(request)),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(fail);
  }

  return NextResponse.redirect(data.url);
}
