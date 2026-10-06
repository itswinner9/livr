import { NextResponse, type NextRequest } from "next/server";
import { oauthCallbackForwardPath } from "@/lib/auth/oauth";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forward = oauthCallbackForwardPath(pathname, request.nextUrl.searchParams);
  // #region agent log
  if (pathname.includes("auth") || request.nextUrl.searchParams.has("code") || forward) {
    fetch("http://127.0.0.1:7857/ingest/eee90640-482f-42c8-8954-1cebbcfb48fe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2a4cb8" },
      body: JSON.stringify({
        sessionId: "2a4cb8",
        hypothesisId: "H1",
        location: "proxy.ts:forward",
        message: "oauth proxy hop",
        data: {
          pathname,
          hasCode: request.nextUrl.searchParams.has("code"),
          next: request.nextUrl.searchParams.get("next"),
          returnTo: request.nextUrl.searchParams.get("return"),
          forward,
          action: forward ? "rewrite" : "passthrough",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  if (forward) {
    const url = request.nextUrl.clone();
    const dest = new URL(forward, request.url);
    url.pathname = dest.pathname;
    url.search = dest.search;
    return NextResponse.rewrite(url);
  }
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (path === "/auth/callback" || path === "/auth/google") {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
