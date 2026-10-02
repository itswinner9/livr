import { NextResponse } from "next/server";
import { authReturnPath } from "@/lib/auth/oauth";
import { safeNextPath } from "@/lib/safe-redirect";
import { createServerSupabase } from "@/lib/supabase/server";

function authError(request: Request, next: string, intent: string | null, code = "google") {
  const { origin } = new URL(request.url);
  const url = new URL(authReturnPath(intent), origin);
  url.searchParams.set("error", code);
  if (next !== "/account") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const intent = searchParams.get("intent");

  if (!code) return authError(request, next, intent);

  const supabase = await createServerSupabase();
  if (!supabase) return authError(request, next, intent, "auth");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return authError(request, next, intent);

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) {
    return NextResponse.redirect(new URL(next, request.url));
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(new URL(next, request.url));
}
