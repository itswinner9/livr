"use client";

import { useState } from "react";
import { authReturnPath, googleCallbackUrl, googleStartPath, type AuthIntent } from "@/lib/auth/oauth";
import { createBrowserSupabase } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({ next, intent }: { next?: string; intent: AuthIntent }) {
  const [pending, setPending] = useState(false);

  async function start(event: React.MouseEvent<HTMLAnchorElement>) {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: googleCallbackUrl(next, intent, window.location.origin),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      const fail = new URL(authReturnPath(intent), window.location.origin);
      fail.searchParams.set("error", "google");
      if (next) fail.searchParams.set("next", next);
      window.location.assign(fail);
    }
  }

  return (
    <a
      href={googleStartPath(next, intent)}
      onClick={start}
      aria-disabled={pending}
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-rule bg-surface px-4 text-sm font-medium text-ink hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <GoogleMark />
      {intent === "signup" ? "Continue with Google" : "Log in with Google"}
    </a>
  );
}

export function AuthDivider() {
  return (
    <p className="mt-6 text-center text-xs font-medium uppercase tracking-wide text-mute">or</p>
  );
}
