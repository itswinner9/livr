import { LoginForm } from "@/components/auth-form";
import { PageHeading, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordForm } from "@/lib/actions/forms";
import { safeNextPath } from "@/lib/safe-redirect";
import { noIndexFollow, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  ...pageMetadata("Log in", "Log in to rate a building or manage your LivRank account.", "/login"),
  ...noIndexFollow(),
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  return (
    <PageShell width="sm">
      <PageHeading
        title="Log in"
        lede={
          next?.startsWith("/rate") || next?.startsWith("/review")
            ? "Log in to rate this place. We'll bring you right back."
            : "Read buildings on file, then add your own experience."
        }
      />
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
