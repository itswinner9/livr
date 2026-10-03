import { AddressSearch } from "@/components/address-search";
import { mapboxToken } from "@/lib/address/provider";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata(
    "Ask LivRank",
    "Open a property page to ask questions grounded in that building's published renter reviews.",
    "/ask",
  ),
  robots: { index: false, follow: true },
};

export default function AskPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Ask LivRank</h1>
      <p className="mt-4 text-sm text-mute">
        Open a property page to ask questions grounded in that building&apos;s published renter
        reviews. Search for a property first.
      </p>
      <div className="mt-6">
        <AddressSearch size="md" mapToken={mapboxToken()} />
      </div>
    </div>
  );
}
