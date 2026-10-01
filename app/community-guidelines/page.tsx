import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata(
  "Community guidelines",
  "Allowed: first-person, specific renter experiences. Not allowed: threats, harassment, doxxing, fake reviews, or private contact information.",
  "/community-guidelines",
);

export default function GuidelinesPage() {
  return (
    <article className="mx-auto my-10 max-w-2xl space-y-4 px-4 text-sm leading-6 text-ink sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Community guidelines</h1>
      <p>Allowed: first-person, specific experiences such as “Maintenance took about two weeks to fix.”</p>
      <p>
        Not allowed: accusations like “The owner is a criminal” without an appropriate verified
        factual or legal source and platform policy permission.
      </p>
      <p>
        Also prohibited: threats, harassment, doxxing, private contact information, discrimination,
        fake reviews, spam, and retaliation campaigns.
      </p>
    </article>
  );
}
