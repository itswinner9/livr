import { appUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";

export type AuthIntent = "login" | "signup";

function isLocalHost(host: string) {
  const name = host.split(":")[0].toLowerCase();
  return name === "localhost" || name === "127.0.0.1" || name === "::1" || name.endsWith(".local");
}

export function publicRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost && !isLocalHost(forwardedHost)) {
    const proto = forwardedProto === "http" ? "http" : "https";
    return `${proto}://${forwardedHost}`;
  }
  const url = new URL(request.url);
  if (!isLocalHost(url.hostname)) return url.origin;
  const configured = appUrl().replace(/\/$/, "");
  try {
    if (!isLocalHost(new URL(configured).hostname)) return configured;
  } catch {
    /* keep the request origin */
  }
  return url.origin;
}

export function googleStartPath(next?: string | null, intent: AuthIntent = "login") {
  const params = new URLSearchParams();
  const dest = next ? safeNextPath(next) : "";
  if (dest && dest !== "/account") params.set("next", dest);
  if (intent === "signup") params.set("intent", "signup");
  const query = params.toString();
  return query ? `/auth/google?${query}` : "/auth/google";
}

export function googleCallbackUrl(next?: string | null, intent: AuthIntent = "login", origin = appUrl()) {
  const params = new URLSearchParams();
  params.set("next", safeNextPath(next));
  if (intent === "signup") params.set("intent", "signup");
  return `${origin.replace(/\/$/, "")}/auth/callback?${params.toString()}`;
}

export function authReturnPath(intent: AuthIntent | string | null | undefined) {
  return intent === "signup" ? "/signup" : "/login";
}

const AUTH_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** When Site URL is the homepage, Google still lands with ?code= — send it to the callback. */
export function oauthCallbackForwardPath(pathname: string, searchParams: URLSearchParams) {
  if (pathname === "/auth/callback") return null;
  const code = searchParams.get("code");
  const hasAuthError =
    searchParams.has("error") &&
    (searchParams.has("error_code") || searchParams.has("error_description"));
  if (!hasAuthError && !(code && AUTH_CODE.test(code))) return null;
  const next = new URLSearchParams();
  if (code && AUTH_CODE.test(code)) next.set("code", code);
  next.set("next", safeNextPath(searchParams.get("next")));
  const intent = searchParams.get("intent");
  if (intent === "signup" || intent === "login") next.set("intent", intent);
  return `/auth/callback?${next.toString()}`;
}

export function oauthErrorMessage(code?: string | null) {
  if (code === "google") {
    return "Google sign-in did not finish. You can try again or use email.";
  }
  if (code === "auth") {
    return "Authentication is not configured yet.";
  }
  return null;
}
