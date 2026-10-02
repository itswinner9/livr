import { NextResponse } from "next/server";
import { authReturnPath, publicRequestOrigin } from "@/lib/auth/oauth";
import { safeNextPath } from "@/lib/safe-redirect";
import { createServerSupabase } from "@/lib/supabase/server";

function authError(request: Request, next: string, intent: string | null, code = "google") {
  const url = new URL(authReturnPath(intent), `${publicRequestOrigin(request)}/`);
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

  return NextResponse.redirect(new URL(next, `${publicRequestOrigin(request)}/`));
}
