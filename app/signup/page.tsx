import { SignupForm } from "@/components/auth-form";
import { PageHeading, PageShell } from "@/components/page-shell";
import { safeNextPath } from "@/lib/safe-redirect";
import { noIndexFollow, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  ...pageMetadata("Create an account", "Email and password only. Real names are not required.", "/signup"),
  ...noIndexFollow(),
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  return (
    <PageShell width="sm">
      <PageHeading title="Create an account" lede="Email and password only. Real names are not required." />
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
