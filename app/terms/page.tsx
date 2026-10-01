import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata(
  "Terms",
  "LivRank is a user-generated information service. Reviews and rent figures are renter-reported unless another source is clearly labeled.",
  "/terms",
);

export default function TermsPage() {
  return (
    <article className="mx-auto my-10 max-w-2xl space-y-4 px-4 text-sm leading-6 text-ink sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Terms</h1>
      <p>
        LivRank is a user-generated information service. Reviews and rent figures are renter-reported
        unless another source is clearly labeled. This text is a product draft, not final legal
        terms.
      </p>
      <p>
        You agree not to post threats, harassment, doxxing, discrimination, fake reviews, or private
        contact information. LivRank may moderate or remove content.
      </p>
      <p>Payments never change ratings, hide legitimate reviews, or alter AI summaries of renter reports.</p>
    </article>
  );
}
