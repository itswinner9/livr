import { LoginForm } from "@/components/auth-form";
import { AuthDivider, GoogleAuthButton } from "@/components/google-auth-button";
import { PageHeading, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { oauthErrorMessage } from "@/lib/auth/oauth";
import { resetPasswordForm } from "@/lib/actions/forms";
import { safeNextPath } from "@/lib/safe-redirect";
import { noIndexFollow, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  ...pageMetadata("Log in", "Log in with Google or email to rate a building or manage your LivRank account.", "/login"),
  ...noIndexFollow(),
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error: rawError } = await searchParams;
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  const oauthError = oauthErrorMessage(rawError);
  return (
    <PageShell width="sm">
      <PageHeading
        title="Log in"
        lede={
          next?.startsWith("/rate") || next?.startsWith("/review")
            ? "Log in to rate this place. We'll bring you right back."
            : next?.startsWith("/admin")
              ? "Staff only. We'll send you to admin after you log in."
              : "Google or email. Then you can add your own experience."
        }
      />
      {oauthError ? (
        <p className="mt-6 border border-destructive/20 bg-surface p-3 text-sm text-destructive" role="alert">
          {oauthError}
        </p>
      ) : null}
      <GoogleAuthButton next={next} intent="login" />
      <AuthDivider />
      <LoginForm next={next} />
      <form action={resetPasswordForm} className="mt-8 space-y-3 border-t border-rule pt-6">
        <p className="text-sm font-medium text-ink">Forgot password?</p>
        <Input name="email" type="email" placeholder="Email" autoComplete="email" />
        <Button variant="outline" className="w-full" type="submit">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-sm text-mute">
        No account?{" "}
        <Link className="font-medium text-accent hover:text-accent-hover" href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>
          Sign up
        </Link>
      </p>
    </PageShell>
  );
}
