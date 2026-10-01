import { PageHeading, PageShell } from "@/components/page-shell";
import { PRICING } from "@/lib/stripe/config";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata(
  "Pricing",
  "Paying never changes a rating or whether a review is public. LivRank pricing for renters and property managers.",
  "/pricing",
);

export default function PricingPage() {
  return (
    <PageShell width="lg">
      <PageHeading
        title="Pricing"
        lede="Paying never changes a rating or whether a review is public."
      />
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {PRICING.map((plan) => (
          <article key={plan.id} className="border-t border-rule pt-4">
            <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
            <p className="mt-1 text-sm text-mute">{plan.audience}</p>
            <p className="mt-4 text-3xl font-semibold text-ink">{plan.priceLabel}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
