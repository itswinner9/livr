import { SignupForm } from "@/components/auth-form";
import { AuthDivider, GoogleAuthButton } from "@/components/google-auth-button";
import { PageHeading, PageShell } from "@/components/page-shell";
import { oauthErrorMessage, oauthFinishRedirect } from "@/lib/auth/oauth";
import { safeNextPath } from "@/lib/safe-redirect";
import { noIndexFollow, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  ...pageMetadata(
    "Create an account",
    "Create a LivRank account with Google or email. Real names are not required.",
    "/signup",
  ),
  ...noIndexFollow(),
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; code?: string; return?: string; intent?: string }>;
}) {
  const raw = await searchParams;
  const finish = oauthFinishRedirect("/signup", raw);
  if (finish) redirect(finish);
  const { next: rawNext, error: rawError } = raw;
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  const oauthError = oauthErrorMessage(rawError);
  return (
    <PageShell width="sm">
      <PageHeading
        title="Create an account"
        lede="Google or email. Real names are not required. If you use Google, we do not put your Google name on public reviews."
      />
      {oauthError ? (
        <p className="mt-6 border border-destructive/20 bg-surface p-3 text-sm text-destructive" role="alert">
          {oauthError}
        </p>
      ) : null}
      <GoogleAuthButton next={next} intent="signup" />
      <AuthDivider />
      <SignupForm next={next} />
      <p className="mt-6 text-sm text-mute">
        Already have an account?{" "}
        <Link className="font-medium text-accent hover:text-accent-hover" href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>
          Log in
        </Link>
      </p>
    </PageShell>
  );
}
