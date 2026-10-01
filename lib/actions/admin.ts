"use server";

import { getSessionUser, isStaff } from "@/lib/auth/session";
import { publishReply, publishReview } from "@/lib/moderation/publish";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ModerateState = { ok?: string; error?: string } | null;

async function requireStaff() {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) return null;
  return user;
}

async function getWriteClient() {
  return createAdminClient() ?? (await createServerSupabase());
}

function revalidatePropertySurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  revalidatePath("/explore");
  revalidatePath("/search");
  revalidatePath("/");
  revalidatePath("/property/[id]", "page");
}

export async function moderateContent(formData: FormData): Promise<NonNullable<ModerateState>> {
  const user = await requireStaff();
  if (!user) return { error: "Not authorized." };
  const writer = await getWriteClient();
  if (!writer) return { error: "Add SUPABASE_SERVICE_ROLE_KEY" };

  const targetType = String(formData.get("targetType"));
  const targetId = String(formData.get("targetId"));
  const action = String(formData.get("action"));
  const reason = String(formData.get("reason") ?? "");

  if (targetType !== "review" && targetType !== "rent_report" && targetType !== "review_reply") {
    return { error: "Unknown item." };
  }

  if (action === "approve" && targetType === "review") {
    return publishReview(writer, targetId, { id: user.id, action: "approve" });
  }
  if (action === "approve" && targetType === "review_reply") {
    return publishReply(writer, targetId, { id: user.id, action: "approve" });
  }

  const table = targetType === "rent_report" ? "rent_reports" : targetType === "review_reply" ? "review_replies" : "reviews";
  const { data: row } =
    targetType === "review_reply"
      ? await writer.from("review_replies").select("reviews (property_id)").eq("id", targetId).maybeSingle()
      : await writer.from(table).select("property_id").eq("id", targetId).maybeSingle();

  const propertyId =
    targetType === "review_reply"
      ? (() => {
          const reviews = (row as { reviews?: { property_id: string } | { property_id: string }[] | null } | null)?.reviews;
          if (!reviews) return null;
          return Array.isArray(reviews) ? (reviews[0]?.property_id ?? null) : reviews.property_id;
        })()
      : ((row as { property_id?: string } | null)?.property_id ?? null);

  if (action === "delete") {
    if (String(formData.get("confirm") ?? "").trim() !== "Delete") {
      return { error: "Type Delete to confirm." };
    }
    const { error } = await writer.from(table).delete().eq("id", targetId);
    if (error) return { error: "We couldn't delete that item." };
  } else {
    const status = action === "approve" ? "published" : action === "reject" ? "rejected" : "hidden";
    const { error } = await writer.from(table).update({ status }).eq("id", targetId);
    if (error) return { error: "We couldn't update that item." };
  }

  const logger = createAdminClient();
  if (logger) {
    await logger.from("moderation_actions").insert({
      moderator_id: user.id,
      target_type: targetType,
      target_id: targetId,
      action,
      reason,
    });
    await logger.from("audit_logs").insert({
      actor_user_id: user.id,
      action: `moderate_${action}`,
      entity_type: targetType,
      entity_id: targetId,
      metadata: { reason },
    });
  }

  if (propertyId) {
    revalidatePath(`/property/${propertyId}`);
    revalidatePath("/property/[id]", "page");
    revalidatePath("/search");
    revalidatePath("/explore");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/rent-reports");
  return {
    ok: action === "delete" ? "Deleted." : action === "hide" ? "Removed from the public file." : "Updated.",
  };
}

export async function hidePropertyAction(
  _prev: ModerateState,
  formData: FormData,
): Promise<NonNullable<ModerateState>> {
  const user = await requireStaff();
  if (!user) return { error: "Not authorized." };
  const writer = await getWriteClient();
  if (!writer) return { error: "Add SUPABASE_SERVICE_ROLE_KEY" };
  const propertyId = String(formData.get("propertyId"));
  const { data: row } = await writer
    .from("properties")
    .select("id, slug, status")
    .eq("id", propertyId)
    .maybeSingle();
  if (!row) return { error: "Property not found." };
  if (row.status === "merged") return { error: "Merged properties cannot be hidden this way." };
  const { error } = await writer.from("properties").update({ status: "hidden" }).eq("id", propertyId);
  if (error) return { error: "We couldn't remove that building." };
  const logger = createAdminClient();
  if (logger) {
    await logger.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "admin_hide_property",
      entity_type: "property",
      entity_id: propertyId,
    });
  }
  revalidatePropertySurfaces();
  if (row.slug) revalidatePath(`/property/${row.slug}`);
  revalidatePath(`/property/${propertyId}`);
  return { ok: "Removed from the public file." };
}

export async function restorePropertyAction(
  _prev: ModerateState,
  formData: FormData,
): Promise<NonNullable<ModerateState>> {
  const user = await requireStaff();
  if (!user) return { error: "Not authorized." };
  const writer = await getWriteClient();
  if (!writer) return { error: "Add SUPABASE_SERVICE_ROLE_KEY" };
  const propertyId = String(formData.get("propertyId"));
  const { data: row } = await writer
    .from("properties")
    .select("id, slug, status")
    .eq("id", propertyId)
    .maybeSingle();
  if (!row) return { error: "Property not found." };
  if (row.status !== "hidden") return { error: "Only hidden buildings can be restored." };
  const { error } = await writer.from("properties").update({ status: "active" }).eq("id", propertyId);
  if (error) return { error: "We couldn't restore that building." };
  const logger = createAdminClient();
  if (logger) {
    await logger.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "admin_restore_property",
      entity_type: "property",
      entity_id: propertyId,
    });
  }
  revalidatePropertySurfaces();
  if (row.slug) revalidatePath(`/property/${row.slug}`);
  revalidatePath(`/property/${propertyId}`);
  return { ok: "Restored to the public file." };
}

export async function deletePropertyAction(
  _prev: ModerateState,
  formData: FormData,
): Promise<NonNullable<ModerateState>> {
  const user = await requireStaff();
  if (!user) return { error: "Not authorized." };
  if (String(formData.get("confirm") ?? "").trim() !== "Delete") {
    return { error: "Type Delete to confirm." };
  }
  const admin = createAdminClient();
  if (!admin) return { error: "Add SUPABASE_SERVICE_ROLE_KEY" };
  const propertyId = String(formData.get("propertyId"));
  const { error } = await admin.rpc("admin_delete_property", {
    p_property_id: propertyId,
    p_actor: user.id,
  });
  if (error) return { error: "We couldn't delete that building." };
  revalidatePropertySurfaces();
  revalidatePath(`/property/${propertyId}`);
  return { ok: "Deleted." };
}

export async function mergePropertiesAction(formData: FormData) {
  const user = await requireStaff();
  if (!user) return { error: "Not authorized." };
  const admin = createAdminClient();
  if (!admin) return { error: "Add SUPABASE_SERVICE_ROLE_KEY" };
  const canonical = String(formData.get("canonical"));
  const duplicate = String(formData.get("duplicate"));
  const { error } = await admin.rpc("merge_properties", {
    canonical,
    duplicate,
    actor: user.id,
  });
  if (error) return { error: "We couldn't merge those properties." };
  return { ok: "Properties merged." };
}
