import { NextResponse, type NextRequest } from "next/server";
import { oauthCallbackForwardPath, publicRequestOrigin } from "@/lib/auth/oauth";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forward = oauthCallbackForwardPath(pathname, request.nextUrl.searchParams);
  if (forward) {
    return NextResponse.redirect(new URL(forward, `${publicRequestOrigin(request)}/`));
  }
  if (pathname === "/auth/callback" || pathname === "/auth/google") {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
