import { PageHeading, PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata(
  "Terms",
  "Plain-language rules for using LivRank. Reviews and rent figures are renter-reported. Paying never changes a rating.",
  "/terms",
);

export default function TermsPage() {
  return (
    <PageShell>
      <PageHeading
        title="Terms"
        lede="A few rules so the building file stays useful. Written in plain language, not lawyer-speak."
      />

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink">
        <section>
          <h2 className="text-lg font-semibold text-ink">Using LivRank</h2>
          <p className="mt-3 text-mute">
            You can search buildings and read published reviews without an account. To write a review, report rent, or
            save a place, you&apos;ll need to sign in. Use the site as it&apos;s meant to be used — don&apos;t try to
            break into someone else&apos;s account, and don&apos;t scrape in a way that gets in other people&apos;s
            way.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">What you post</h2>
          <p className="mt-3 text-mute">
            Write about a place you actually lived, in your own words. Be specific. Don&apos;t post threats,
            harassment, hate, fake reviews, or anyone&apos;s private contact information. Don&apos;t try to identify a
            current neighbour by unit in public text. Full details live in the{" "}
            <Link href="/community-guidelines" className="font-semibold text-accent hover:text-accent-hover">
              community guidelines.
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">What we can do</h2>
          <p className="mt-3 text-mute">
            We may hide or remove posts that break those rules, or that look like spam. Reviews and rent figures are
            renter-reported unless another source is clearly labeled. We don&apos;t claim official rental history or
            guaranteed accuracy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">Paying</h2>
          <p className="mt-3 text-mute">
            If you pay for a plan, you&apos;re paying for extra tools, not a better score. Money never changes a
            rating, never hides a legitimate review, and never rewrites             an AI summary of renter reports. See{" "}
            <Link href="/pricing" className="font-semibold text-accent hover:text-accent-hover">
              pricing.
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">This isn&apos;t a law-firm contract</h2>
          <p className="mt-3 text-mute">
            This page is how LivRank works today, in everyday language. It isn&apos;t a substitute for a full legal
            agreement. How we handle email, unit numbers, and deletion is on the{" "}
            <Link href="/privacy" className="font-semibold text-accent hover:text-accent-hover">
              privacy
            </Link>{" "}
            page.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
