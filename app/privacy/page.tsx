import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata(
  "Privacy",
  "How LivRank is designed to handle account information, reviews, and rent reports. Email is used for authentication and is not shown on public reviews.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <article className="mx-auto my-10 max-w-2xl space-y-4 px-4 text-sm leading-6 text-ink sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Privacy</h1>
      <p>
        This page describes how LivRank is designed to handle information. It is not a certified
        legal opinion. Canadian legal review is expected before commercial launch.
      </p>
      <h2 className="text-lg font-medium text-ink">Account information</h2>
      <p>Email is used for authentication. It is not shown on public reviews.</p>
      <h2 className="text-lg font-medium text-ink">Reviews and rent reports</h2>
      <p>
        Public reviews default to “Former renter” or “Current renter”. Phone numbers and private
        documents are not intended for public display.
      </p>
      <h2 className="text-lg font-medium text-ink">Unit numbers</h2>
      <p>
        You can attach a unit number to a review. It is stored privately for everyone. The unit is
        shown on the public building and unit pages only when you identify as a former renter.
        Current renters&apos; unit numbers stay hidden so a landlord cannot tell which suite a
        current tenant reviewed. Every review still counts toward the building rating.
      </p>
      <h2 className="text-lg font-medium text-ink">AI processing</h2>
      <p>
        When OpenRouter is configured, published review text may be sent to generate topics,
        embeddings, summaries, and Ask LivRank answers. Emails, private IDs, and verification
        documents are not sent for those tasks.
      </p>
      <h2 className="text-lg font-medium text-ink">Moderation, security, deletion</h2>
      <p>
        Staff can approve, reject, or hide content. You may request account deletion from your
        account page. Published property-level history may be retained in anonymized form.
      </p>
      <p>Analytics events do not include unnecessary sensitive fields. Cookies are used for auth sessions.</p>
    </article>
  );
}
