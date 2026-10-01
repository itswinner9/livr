"use server";

import { retrieveAddress, toDraft, type AddressDraft } from "@/lib/address/provider";
import { normalizeUnit } from "@/lib/address/normalize";
import { addressDraftInputSchema, draftToSearchParams } from "@/lib/address/draft-params";
import { getSessionUser } from "@/lib/auth/session";
import { findPropertyForAddress } from "@/lib/properties/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";
import { logServerError } from "@/lib/errors";

export type ResolveAddressResult =
  | {
      ok: true;
      draft: AddressDraft;
      existing: { id: string; slug: string | null; status: "active" | "pending" } | null;
    }
  | { ok: false; error: string };

/** Turns a Mapbox suggestion into a LivRank-normalized address and checks for an existing page. */
export async function resolveAddressAction(mapboxId: string, sessionToken: string): Promise<ResolveAddressResult> {
  if (typeof mapboxId !== "string" || !mapboxId || mapboxId.length > 300 || !isUuid(sessionToken)) {
    return { ok: false, error: "That address couldn't be loaded. Try searching again." };
  }
  const result = await retrieveAddress(mapboxId, sessionToken);
  if (!result) {
    return {
      ok: false,
      error: "We couldn't confirm a street address for that result. Try including the building number.",
    };
  }
  const draft = toDraft(result);
  const existing = await findPropertyForAddress(draft.normalized_address, draft.provider_place_id);
  return { ok: true, draft, existing };
}

export type StartRatingState = { error?: string; redirectTo?: string } | null;

/**
 * Resolves (or creates, as pending) the property for a confirmed address, then sends the renter
 * to the review or rent form. Signed-out renters go through login and come back to /rate.
 */
export async function startRatingAction(_prev: StartRatingState, formData: FormData): Promise<StartRatingState> {
  const parsed = addressDraftInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "That address looks incomplete. Check the street number, city, and province." };
  const input = parsed.data;
  const destination = (id: string) => {
    const params = new URLSearchParams({ propertyId: id });
    const unit = normalizeUnit(input.unit ?? undefined);
    if (unit && input.intent === "review") params.set("unit", unit);
    return input.intent === "rent" ? `/rent-report/new?${params}` : `/review/new?${params}`;
  };

  const user = await getSessionUser();
  if (!user) {
    return { redirectTo: `/login?next=${encodeURIComponent(`/rate?${draftToSearchParams(input).toString()}`)}` };
  }

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

  const supabase = await createServerSupabase();
  if (!supabase) return { error: "We couldn't reach the database. Please try again." };
  const { data, error } = await supabase
    .rpc("find_or_create_property", {
      p_address_line_1: draft.address_line_1,
      p_address_line_2: null,
      p_city: draft.city,
      p_province: draft.province,
      p_postal_code: draft.postal_code,
      p_normalized_address: draft.normalized_address,
      p_normalized_city: draft.normalized_city,
      p_normalized_postal_code: draft.normalized_postal_code,
      p_slug: draft.slug,
      p_latitude: draft.latitude,
      p_longitude: draft.longitude,
      p_provider_place_id: draft.provider_place_id,
    })
    .single<{ id: string; slug: string | null; status: string; created: boolean }>();

  if (error || !data) {
    if (error?.code === "P0429") {
      return { error: "You've added a lot of new addresses recently. Please try again later." };
    }
    logServerError("startRatingAction", error);
    return { error: "We couldn't open that address. Please try again." };
  }
  return { redirectTo: destination(data.id) };
}
