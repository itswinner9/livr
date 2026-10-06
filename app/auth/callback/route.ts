import { NextResponse, type NextRequest } from "next/server";
import { authReturnPath, publicRequestOrigin } from "@/lib/auth/oauth";
import { safeNextPath } from "@/lib/safe-redirect";
import { createRouteSupabase, redirectWithCookies } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

function failUrl(request: NextRequest, next: string, intent: string | null, code = "google") {
  const url = new URL(authReturnPath(intent), `${publicRequestOrigin(request)}/`);
  url.searchParams.set("error", code);
  if (next !== "/account") url.searchParams.set("next", next);
  return url;
}

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const intent = request.nextUrl.searchParams.get("intent");
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const origin = publicRequestOrigin(request);
  const jar: Parameters<typeof redirectWithCookies>[1] = [];

  if (!code) return NextResponse.redirect(failUrl(request, next, intent));

  const supabase = createRouteSupabase(request, jar, origin);
  if (!supabase) return NextResponse.redirect(failUrl(request, next, intent, "auth"));

  const { error } = flowId
    ? await supabase.auth.exchangeCodeForSession(code, { flowId })
    : await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return redirectWithCookies(failUrl(request, next, intent), jar, origin);
  }

  return redirectWithCookies(new URL(next, `${origin}/`), jar, origin);
}
