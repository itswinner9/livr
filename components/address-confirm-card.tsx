"use client";

import { useState, type FormEvent } from "react";
import { startRatingAction } from "@/lib/actions/address";
import type { AddressDraft } from "@/lib/address/provider";
import { PropertyMap } from "@/components/maps/property-map";

export function AddressConfirmCard({
  draft,
  mapToken,
  pending: isPendingProperty = false,
  unit = null,
  onCancel,
}: {
  draft: Pick<
    AddressDraft,
    "address_line_1" | "city" | "province" | "postal_code" | "latitude" | "longitude" | "provider_place_id"
  >;
  mapToken: string | null;
  pending?: boolean;
  unit?: string | null;
  onCancel?: () => void;
}) {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const title = `${draft.address_line_1}, ${draft.city}, ${draft.province}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.name) {
      formData.set(submitter.name, submitter.value);
    }
    try {
      const result = await startRatingAction(null, formData);
      if (result?.redirectTo) {
        // Full document navigation so a leftover server-action reply cannot
        // overlay /review/new (Next.js E394).
        window.location.assign(result.redirectTo);
        return;
      }
      setError(result?.error ?? "We couldn't open that address. Please try again.");
    } catch {
      setError("We couldn't open that address. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <section
      aria-labelledby="confirm-address-title"
      className="overflow-hidden border border-rule bg-surface text-left"
    >
      <PropertyMap
        pins={[
          { id: "draft", latitude: draft.latitude, longitude: draft.longitude, label: title },
        ]}
        token={mapToken}
        zoom={16}
        interactive={false}
        className="h-40 rounded-none"
      />
      <div className="border-t border-rule p-4">
        <p className="kicker">Is this the right place?</p>
        <h2 id="confirm-address-title" className="display mt-2 text-2xl text-ink">
          {draft.address_line_1}
        </h2>
        <p className="mt-1 text-sm text-mute">
          {draft.city}, {draft.province} {draft.postal_code ?? ""}
        </p>
        <p className="mt-3 text-sm text-mute">
          {isPendingProperty
            ? "Another renter has started a page for this address. Add your experience to help it go live."
            : "No renter reviews here yet. Be the first to share what it's like to live here."}
        </p>
        {error ? (
          <p role="alert" className="mt-3 border border-rule px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="address_line_1" value={draft.address_line_1} />
          <input type="hidden" name="city" value={draft.city} />
          <input type="hidden" name="province" value={draft.province} />
          <input type="hidden" name="postal_code" value={draft.postal_code ?? ""} />
          <input type="hidden" name="latitude" value={draft.latitude ?? ""} />
          <input type="hidden" name="longitude" value={draft.longitude ?? ""} />
          <input type="hidden" name="provider_place_id" value={draft.provider_place_id ?? ""} />
          {unit ? <input type="hidden" name="unit" value={unit} /> : null}
          <button
            type="submit"
            name="intent"
            value="review"
            disabled={submitting}
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Opening…" : "Rate this place"}
          </button>
          <button
            type="submit"
            name="intent"
            value="rent"
            disabled={submitting}
            className="rounded-md border border-rule px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-white/5 disabled:opacity-60"
          >
            Report rent
          </button>
          {onCancel ? (
            <button type="button" onClick={onCancel} className="ml-auto text-sm text-mute hover:text-ink">
              Not this one
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
}
