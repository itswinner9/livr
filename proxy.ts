import { NextResponse, type NextRequest } from "next/server";
import { oauthCallbackForwardPath, publicRequestOrigin } from "@/lib/auth/oauth";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const forward = oauthCallbackForwardPath(request.nextUrl.pathname, request.nextUrl.searchParams);
  if (forward) {
    return NextResponse.redirect(new URL(forward, `${publicRequestOrigin(request)}/`));
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
