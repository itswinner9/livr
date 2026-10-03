import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddressConfirmCard } from "@/components/address-confirm-card";
import { AddressSearch } from "@/components/address-search";
import { addressDraftInputSchema, draftFromSearchParams } from "@/lib/address/draft-params";
import { mapboxToken, toDraft } from "@/lib/address/provider";
import { normalizeUnit } from "@/lib/address/normalize";
import { findPropertyForAddress } from "@/lib/properties/queries";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const intent = (Array.isArray(params.intent) ? params.intent[0] : params.intent) === "rent" ? "rent" : "review";
  return {
    title: intent === "rent" ? "Report rent" : "Rate a rental",
    robots: { index: false, follow: false },
  };
}

function RateIntentSwitch({ intent }: { intent: "review" | "rent" }) {
  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={
        active
          ? "inline-flex min-h-11 items-center rounded-md bg-ink px-3.5 text-sm font-semibold text-paper"
          : "inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-mute hover:bg-muted hover:text-ink"
      }
    >
      {label}
    </Link>
  );
  return (
    <div className="mt-4 flex flex-wrap gap-1 rounded-md border border-rule bg-surface p-1">
      {tab("/rate", "Write a review", intent === "review")}
      {tab("/rate?intent=rent", "Report rent only", intent === "rent")}
    </div>
  );
}

export default async function RatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = draftFromSearchParams(params);
  const parsed = addressDraftInputSchema.safeParse(raw);
  const token = mapboxToken();
  const intent = (Array.isArray(params.intent) ? params.intent[0] : params.intent) === "rent" ? "rent" : "review";
  const heading = intent === "rent" ? "Report your rent" : "Rate a rental";
  const lead =
    intent === "rent"
      ? "Search any address in Canada and file what you paid. You do not need to rate the building."
      : "Search any address in Canada, then pick it from the list.";

  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">{heading}</h1>
        <p className="mt-2 text-sm text-mute">{lead}</p>
        <RateIntentSwitch intent={intent} />
        <div className="mt-6">
          <AddressSearch size="md" mapToken={token} intent={intent} />
        </div>
        <p className="mt-6 text-sm text-mute">
          Can&apos;t find it?{" "}
          <Link className="font-medium text-accent hover:text-accent-hover" href="/property/new">
            Add the address manually
          </Link>
        </p>
      </div>
    );
  }

  const input = parsed.data;
  const draft = toDraft({
    address_line_1: input.address_line_1,
    address_line_2: null,
    city: input.city,
    province: input.province,
    postal_code: input.postal_code ?? null,
    country: "Canada",
    latitude: input.latitude,
    longitude: input.longitude,
    provider_place_id: input.provider_place_id ?? null,
    normalized_address: "",
  });
  const existing = await findPropertyForAddress(draft.normalized_address, draft.provider_place_id);
  if (existing?.status === "active") {
    const target = input.intent === "rent" ? "/rent-report/new" : "/review/new";
    const params = new URLSearchParams({ propertyId: existing.id });
    const unit = normalizeUnit(input.unit ?? undefined);
    if (unit && input.intent !== "rent") params.set("unit", unit);
    redirect(`${target}?${params}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">{heading}</h1>
      <RateIntentSwitch intent={intent} />
      <div className="mt-6">
        <AddressConfirmCard
          draft={draft}
          mapToken={token}
          pending={existing?.status === "pending"}
          unit={normalizeUnit(input.unit ?? undefined)}
          preferredIntent={intent}
        />
      </div>
      <p className="mt-6 text-sm text-mute">
        Wrong address?{" "}
        <Link className="font-medium text-accent hover:text-accent-hover" href="/rate">
          Search again
        </Link>
      </p>
    </div>
  );
}
