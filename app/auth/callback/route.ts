import { NextResponse, type NextRequest } from "next/server";
import { authReturnPath, publicRequestOrigin, safeAuthReturnPath } from "@/lib/auth/oauth";
import { createRouteSupabase, redirectWithCookies } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

function failUrl(request: NextRequest, next: string, intent: string | null, code = "google") {
  const url = new URL(authReturnPath(intent), `${publicRequestOrigin(request)}/`);
  url.searchParams.set("error", code);
  if (next !== "/account") url.searchParams.set("next", next);
  return url;
}

export async function GET(request: NextRequest) {
  const next = safeAuthReturnPath(request.nextUrl.searchParams.get("return") ?? request.nextUrl.searchParams.get("next"));
  const intent = request.nextUrl.searchParams.get("intent");
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const origin = publicRequestOrigin(request);
  const jar: Parameters<typeof redirectWithCookies>[1] = [];
  const dest = new URL(next, `${origin}/`).toString();

  if (!code) {
    const fail = failUrl(request, next, intent);
    // #region agent log
    fetch("http://127.0.0.1:7857/ingest/eee90640-482f-42c8-8954-1cebbcfb48fe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2a4cb8" },
      body: JSON.stringify({
        sessionId: "2a4cb8",
        hypothesisId: "H3",
        location: "app/auth/callback/route.ts:no-code",
        message: "callback missing code",
        data: { next, dest, fail: fail.pathname + fail.search, origin },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.redirect(fail);
  }

  const supabase = createRouteSupabase(request, jar, origin);
  if (!supabase) return NextResponse.redirect(failUrl(request, next, intent, "auth"));

  const { error } = flowId
    ? await supabase.auth.exchangeCodeForSession(code, { flowId })
    : await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      const fail = failUrl(request, next, intent);
      // #region agent log
      fetch("http://127.0.0.1:7857/ingest/eee90640-482f-42c8-8954-1cebbcfb48fe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2a4cb8" },
        body: JSON.stringify({
          sessionId: "2a4cb8",
          hypothesisId: "H4",
          location: "app/auth/callback/route.ts:exchange-fail",
          message: "callback exchange failed",
          data: {
            next,
            dest,
            fail: fail.pathname + fail.search,
            error: error.message.slice(0, 120),
            hasUser: false,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return redirectWithCookies(fail, jar, origin);
    }
  }

  // #region agent log
  fetch("http://127.0.0.1:7857/ingest/eee90640-482f-42c8-8954-1cebbcfb48fe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2a4cb8" },
    body: JSON.stringify({
      sessionId: "2a4cb8",
      hypothesisId: "H3",
      location: "app/auth/callback/route.ts:success",
      message: "callback redirecting after exchange",
      data: { next, dest, exchangeError: error?.message.slice(0, 120) ?? null, selfRedirect: dest.includes("/auth/callback") },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return redirectWithCookies(new URL(next, `${origin}/`), jar, origin);
}
