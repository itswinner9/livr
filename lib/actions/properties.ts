"use server";

import { getSessionUser } from "@/lib/auth/session";
import {
  buildNormalizedAddress,
  formatPostalCode,
  normalizeCity,
  normalizePostalCode,
  normalizeProvince,
  slugifyProperty,
  stripUnit,
} from "@/lib/address/normalize";
import { logServerError } from "@/lib/errors";
import { createServerSupabase } from "@/lib/supabase/server";
import { propertyCreateSchema } from "@/lib/validation/schemas";
import { redirect } from "next/navigation";

/**
 * Manual fallback for addresses Mapbox can't find. Resolves to an existing page when the
 * address is already known; otherwise proposes a pending page and opens the review form.
 */
export async function createProperty(formData: FormData): Promise<{ error: string }> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/property/new");
  const parsed = propertyCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the address." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "We couldn't create that property." };
  const input = parsed.data;
  const province = normalizeProvince(input.province) ?? input.province;
  const identity = { address_line_1: stripUnit(input.address_line_1), city: input.city.trim(), province };
  const { data, error } = await supabase
    .rpc("find_or_create_property", {
      p_address_line_1: identity.address_line_1,
      p_address_line_2: input.address_line_2 ?? null,
      p_city: identity.city,
      p_province: province,
      p_postal_code: formatPostalCode(input.postal_code) ?? null,
      p_normalized_address: buildNormalizedAddress(identity),
      p_normalized_city: normalizeCity(identity.city),
      p_normalized_postal_code: normalizePostalCode(input.postal_code ?? null),
      p_slug: slugifyProperty(identity),
      p_latitude: input.latitude ?? null,
      p_longitude: input.longitude ?? null,
      p_provider_place_id: input.provider_place_id ?? null,
      p_building_name: input.building_name ?? null,
      p_property_type: input.property_type ?? null,
    })
    .single<{ id: string; slug: string | null; status: string; created: boolean }>();
  if (error || !data) {
    if (error?.code === "P0429") return { error: "You've added a lot of new addresses recently. Try again later." };
    logServerError("createProperty", error);
    return { error: "We couldn't create that property." };
  }
  if (!data.created && data.status === "active") redirect(`/property/${data.slug || data.id}`);
  redirect(`/review/new?propertyId=${data.id}`);
}

export async function claimProperty(propertyId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Claims require a configured database." };
  const { error } = await supabase.from("property_claims").insert({
    property_id: propertyId,
    user_id: user.id,
    verification_status: "pending",
    verification_method: "self_attested",
  });
  if (error) return { error: "We couldn't start that claim." };
  return { ok: "Claim submitted. It stays unverified until a moderator approves it." };
}

export async function submitManagerResponse(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Unavailable in demo mode." };
  const { error } = await supabase.from("management_responses").insert({
    review_id: String(formData.get("reviewId")),
    property_id: String(formData.get("propertyId")),
    manager_user_id: user.id,
    response_body: String(formData.get("response_body") ?? ""),
    status: "published",
  });
  if (error) return { error: "We couldn't post that response." };
  return { ok: "Response published." };
}
