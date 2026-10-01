"use server";

import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { decideReviewVisibility } from "@/lib/moderation/auto-approve";
import { publishReply, publishReview } from "@/lib/moderation/publish";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { flagSchema, reviewReplySchema, reviewSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { track } from "@/lib/analytics";
import { logServerError } from "@/lib/errors";
import { normalizeUnit } from "@/lib/address/normalize";

const REVIEW_PUBLISHED = "Thanks. Your review is published.";
const REVIEW_HELD = "Thanks. Moderators will check this before it appears publicly.";
const REPLY_PUBLISHED = "Thanks. Your reply is published.";
const REPLY_HELD = "Thanks. Moderators will check this before it appears publicly.";

export type ReviewFormState = {
  ok?: string;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
  published?: boolean;
} | null;

export async function submitReview(formData: FormData): Promise<NonNullable<ReviewFormState>> {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Please log in to share a review.", values };
    const limited = rateLimit(`review:${user.id}`, 8, 60 * 60 * 1000);
    if (!limited.ok) return { error: "Please wait before submitting another review.", values };

    const parsed = reviewSchema.safeParse({
      propertyId: formData.get("propertyId"),
      overall_rating: formData.get("overall_rating"),
      maintenance_rating: formData.get("maintenance_rating") || undefined,
      management_rating: formData.get("management_rating") || undefined,
      noise_rating: formData.get("noise_rating") || undefined,
      cleanliness_rating: formData.get("cleanliness_rating") || undefined,
      building_condition_rating: formData.get("building_condition_rating") || undefined,
      parking_rating: formData.get("parking_rating") || undefined,
      value_rating: formData.get("value_rating") || undefined,
      review_title: formData.get("review_title"),
      review_body: formData.get("review_body"),
      bedrooms: formData.get("bedrooms") || undefined,
      bathrooms: formData.get("bathrooms") || undefined,
      monthly_rent: formData.get("monthly_rent") || undefined,
      move_in_year: formData.get("move_in_year") || undefined,
      move_out_year: formData.get("move_out_year") || undefined,
      renter_status: formData.get("renter_status"),
      public_display_name: formData.get("public_display_name") === "on",
      unit_label: formData.get("unit_label") || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] ??= issue.message;
      }
      return { error: "Please fix the highlighted fields.", fieldErrors, values };
    }
    const supabase = await createServerSupabase();
    if (!supabase) {
      return { error: "We couldn't save your review. Please try again.", values };
    }
    let unitId: string | null = null;
    const unitKey = normalizeUnit(parsed.data.unit_label);
    if (unitKey) {
      const { data: createdUnit, error: unitError } = await supabase.rpc("find_or_create_unit", {
        p_property_id: parsed.data.propertyId,
        p_unit_label: parsed.data.unit_label,
      });
      if (unitError || !createdUnit) {
        if (unitError?.code === "P0429") {
          return { error: "You've added a lot of unit numbers recently. Please try again later.", values };
        }
        if (unitError?.code === "22023") {
          return {
            error: "Please fix the highlighted fields.",
            fieldErrors: { unit_label: "Use a short unit number such as 1204, 12B, or PH2." },
            values,
          };
        }
        logServerError("submitReview.find_or_create_unit", unitError);
        return { error: "We couldn't save that unit number. Please try again.", values };
      }
      unitId = String(createdUnit);
    }
    const decision = await decideReviewVisibility({
      title: parsed.data.review_title,
      body: parsed.data.review_body,
    });
    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert({
        property_id: parsed.data.propertyId,
        user_id: user.id,
        unit_id: unitId,
        overall_rating: parsed.data.overall_rating,
        maintenance_rating: parsed.data.maintenance_rating ?? null,
        management_rating: parsed.data.management_rating ?? null,
        noise_rating: parsed.data.noise_rating ?? null,
        cleanliness_rating: parsed.data.cleanliness_rating ?? null,
        building_condition_rating: parsed.data.building_condition_rating ?? null,
        parking_rating: parsed.data.parking_rating ?? null,
        value_rating: parsed.data.value_rating ?? null,
        review_title: parsed.data.review_title,
        review_body: parsed.data.review_body,
        bedrooms: parsed.data.bedrooms ?? null,
        bathrooms: parsed.data.bathrooms ?? null,
        monthly_rent: parsed.data.monthly_rent ?? null,
        move_in_year: parsed.data.move_in_year ?? null,
        move_out_year: parsed.data.move_out_year ?? null,
        renter_status: parsed.data.renter_status,
        public_display_name: parsed.data.public_display_name,
        status: "pending",
        heuristic_flags: decision.reasons.length ? { reasons: decision.reasons } : null,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      if (error?.code === "23505") {
        return {
          error: "You already have a review for this unit/building. You can edit it from your account.",
          values,
        };
      }
      return { error: "We couldn't save your review. Please try again.", values };
    }

    const admin = createAdminClient();
    if (decision.publish && admin) {
      const published = await publishReview(admin, inserted.id, { id: user.id, action: "auto_approve" });
      if (!("error" in published)) {
        track("review_submit", { propertyId: parsed.data.propertyId, published: true });
        revalidatePath(`/property/${parsed.data.propertyId}`);
        return { ok: REVIEW_PUBLISHED, published: true };
      }
      await admin.from("reviews").update({ heuristic_flags: { reasons: ["publish_failed"] } }).eq("id", inserted.id);
    }

    track("review_submit", { propertyId: parsed.data.propertyId, published: false });
    revalidatePath(`/property/${parsed.data.propertyId}`);
    return { ok: REVIEW_HELD };
  } catch (error) {
    logServerError("submitReview", error);
    return { error: "We couldn't save your review. Please try again.", values };
  }
}

export async function flagReview(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in to report a review." };
  const limited = rateLimit(`flag:${user.id}`, 20);
  if (!limited.ok) return { error: "Please wait before sending more reports." };
  const parsed = flagSchema.safeParse({
    reviewId: formData.get("reviewId"),
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) return { error: "Please choose a reason." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "We couldn't send that report. Please try again." };
  const { error } = await supabase.from("review_flags").insert({
    review_id: parsed.data.reviewId,
    reported_by: user.id,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
  if (error) return { error: "We couldn't send that report. Please try again." };
  return { ok: "Thanks. Moderators will review this." };
}

export async function submitReply(formData: FormData): Promise<NonNullable<ReviewFormState>> {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Please log in to reply.", values };
    const limited = rateLimit(`reply:${user.id}`, 20, 60 * 60 * 1000);
    if (!limited.ok) return { error: "Please wait before submitting another reply.", values };

    const parsed = reviewReplySchema.safeParse({
      reviewId: formData.get("reviewId"),
      body: formData.get("body"),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] ??= issue.message;
      }
      return { error: "Please fix the highlighted fields.", fieldErrors, values };
    }

    const supabase = await createServerSupabase();
    if (!supabase) return { error: "We couldn't save your reply. Please try again.", values };

    const { data: parent } = await supabase
      .from("public_reviews")
      .select("id, property_id")
      .eq("id", parsed.data.reviewId)
      .maybeSingle();
    if (!parent) return { error: "That review is not available.", values };

    const decision = await decideReviewVisibility({ title: "", body: parsed.data.body });
    const { data: inserted, error } = await supabase
      .from("review_replies")
      .insert({
        review_id: parsed.data.reviewId,
        user_id: user.id,
        body: parsed.data.body,
        status: "pending",
        heuristic_flags: decision.reasons.length ? { reasons: decision.reasons } : null,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { error: "We couldn't save your reply. Please try again.", values };
    }

    const admin = createAdminClient();
    if (decision.publish && admin) {
      const published = await publishReply(admin, inserted.id, { id: user.id, action: "auto_approve" });
      if (!("error" in published)) {
        track("reply_submit", { reviewId: parsed.data.reviewId, published: true });
        revalidatePath(`/property/${parent.property_id}`);
        revalidatePath("/property/[id]", "page");
        return { ok: REPLY_PUBLISHED, published: true };
      }
      await admin
        .from("review_replies")
        .update({ heuristic_flags: { reasons: ["publish_failed"] } })
        .eq("id", inserted.id);
    }

    track("reply_submit", { reviewId: parsed.data.reviewId, published: false });
    revalidatePath(`/property/${parent.property_id}`);
    revalidatePath("/property/[id]", "page");
    return { ok: REPLY_HELD };
  } catch (error) {
    logServerError("submitReply", error);
    return { error: "We couldn't save your reply. Please try again.", values };
  }
}
