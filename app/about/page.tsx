import { PageHeading, PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata(
  "About LivRank",
  "Know before you move to your new home. LivRank is a Canada-wide building file: look up an address, read what renters said, and add your own experience if you have one.",
  "/about",
);

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeading
        title="About LivRank"
        lede="Know before you move. A Canada-wide building file, written by people who lived there."
      />

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink">
        <p>
          Signing a lease is a big decision. Most listings show photos and a price. They don&apos;t tell you whether
          the elevator works, how long maintenance takes, or what last year&apos;s rent actually was. LivRank is the
          place to read that, from renters, before you put money down.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-ink">How it works</h2>
          <p className="mt-3 text-mute">
            Search any Canadian address. If the building is already on file, you can read published reviews, ratings,
            and reported rent. If it isn&apos;t, you can be the first to{" "}
            <Link href="/rate" className="font-semibold text-accent hover:text-accent-hover">
              write a review
            </Link>{" "}
            or report what you paid. The building is the record — we don&apos;t rank neighbourhoods or invent a
            best-of list.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">What you&apos;re reading</h2>
          <p className="mt-3 text-mute">
            Reviews and rent numbers come from renters, not from landlords or a government registry. We hide spam and
            abuse, but we don&apos;t promise every report is perfect, complete, or official. Treat it as other
            people&apos;s experience, then go see the place yourself.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">If you manage a building</h2>
          <p className="mt-3 text-mute">
            You can claim a file and reply. Paying never buys a better rating, never hides a fair review, and never
            rewrites what renters said. See{" "}
            <Link href="/pricing" className="font-semibold text-accent hover:text-accent-hover">
              pricing
            </Link>{" "}
            and{" "}
            <Link href="/community-guidelines" className="font-semibold text-accent hover:text-accent-hover">
              community guidelines.
            </Link>
          </p>
        </section>
      </div>
    </PageShell>
  );
}
