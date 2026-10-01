import { PageHeading, PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata(
  "About LivRank",
  "LivRank is a Canada-first rental record. The building is the record. Renters search a place and read renter-reported experiences, ratings, and rent history before they sign.",
  "/about",
);

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeading
        title="About LivRank"
        lede="A Canada-first rental record. The building is the record. Renters search a place and read experiences, ratings, and rent history before they sign."
      />
      <p className="mt-6 text-sm leading-6 text-ink">Know the place before you rent it.</p>
      <p className="mt-3 text-sm leading-6 text-mute">
        LivRank does not claim official rental history, guaranteed accuracy, or verified truth.
      </p>
    </PageShell>
  );
}
