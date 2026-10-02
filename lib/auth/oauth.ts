import { appUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";

export type AuthIntent = "login" | "signup";

export function googleStartPath(next?: string | null, intent: AuthIntent = "login") {
  const params = new URLSearchParams();
  const dest = next ? safeNextPath(next) : "";
  if (dest && dest !== "/account") params.set("next", dest);
  if (intent === "signup") params.set("intent", "signup");
  const query = params.toString();
  return query ? `/auth/google?${query}` : "/auth/google";
}

export function googleCallbackUrl(next?: string | null, intent: AuthIntent = "login") {
  const params = new URLSearchParams();
  params.set("next", safeNextPath(next));
  if (intent === "signup") params.set("intent", "signup");
  return `${appUrl()}/auth/callback?${params.toString()}`;
}

export function authReturnPath(intent: AuthIntent | string | null | undefined) {
  return intent === "signup" ? "/signup" : "/login";
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
