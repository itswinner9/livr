import { PageHeading, PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMetadata(
  "Community guidelines",
  "Write about a place you actually lived. Be specific. Don't post threats, fake reviews, or anyone's private information.",
  "/community-guidelines",
);

export default function GuidelinesPage() {
  return (
    <PageShell>
      <PageHeading
        title="Community guidelines"
        lede="The building file only helps if people write like neighbours, not like a marketing team or a courtroom."
      />

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink">
        <section>
          <h2 className="text-lg font-semibold text-ink">Write what you lived</h2>
          <p className="mt-3 text-mute">
            First person, and specific. “Maintenance took about two weeks to fix the heat” is useful. “This building
            is a nightmare” is not. Stick to what you saw, heard, paid, and dealt with.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">Don&apos;t go after people</h2>
          <p className="mt-3 text-mute">
            Don&apos;t post threats, harassment, hate, or anyone&apos;s private contact information. Don&apos;t try to
            name a current neighbour by unit. Don&apos;t accuse someone of a crime unless you have a real, checkable
            source and it actually belongs on this site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">Don&apos;t fake it</h2>
          <p className="mt-3 text-mute">
            No fake reviews, spam, or review-bombing. If you manage the building, say so and use the reply tools —
            don&apos;t pretend to be a renter. We may hide or remove posts that break these rules. The{" "}
            <Link href="/terms" className="font-semibold text-accent hover:text-accent-hover">
              terms
            </Link>{" "}
            page has the rest.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
