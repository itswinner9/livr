import "server-only";

import { processPublishedReview } from "@/lib/actions/ai";
import { generatePropertySummary } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PublishActor = {
  id: string;
  action: "auto_approve" | "approve";
};

export type PublishResult = { ok: string } | { error: string };

async function maybeRefreshPropertySummary(propertyId: string) {
  const admin = createAdminClient();
  if (!admin) return;
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, review_title, review_body, overall_rating")
    .eq("property_id", propertyId)
    .eq("status", "published");
  if ((reviews?.length ?? 0) < 1) return;
  try {
    const { data: prop } = await admin
      .from("properties")
      .select("address_line_1, city, province")
      .eq("id", propertyId)
      .single();
    const summary = await generatePropertySummary({
      propertyLabel: prop ? `${prop.address_line_1}, ${prop.city} ${prop.province}` : "this property",
      reviewCount: reviews!.length,
      reviews: reviews!.map((review) => ({
        id: review.id,
        title: review.review_title,
        body: review.review_body,
        overall_rating: review.overall_rating,
      })),
    });
    await admin.from("property_ai_summaries").upsert({
      property_id: propertyId,
      summary_text: summary.summary,
      source_review_count: reviews!.length,
      model_name: process.env.OPENROUTER_REASONING_MODEL || "openai/gpt-4o",
      status: "ready",
      generated_at: new Date().toISOString(),
    });
  } catch {
    // Keep the published review even if the summary fails.
  }
}

export async function publishReview(
  client: SupabaseClient,
  reviewId: string,
  actor: PublishActor,
): Promise<PublishResult> {
  const { data: row } = await client.from("reviews").select("id, property_id, status").eq("id", reviewId).maybeSingle();
  if (!row) return { error: "We couldn't update that item." };

  if (row.status !== "published") {
    const { error } = await client
      .from("reviews")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", reviewId);
    if (error) return { error: "We couldn't update that item." };
  }

  const logger = createAdminClient();
  if (logger) {
    await logger.from("moderation_actions").insert({
      moderator_id: actor.id,
      target_type: "review",
      target_id: reviewId,
      action: actor.action,
    });
    await logger.from("audit_logs").insert({
      actor_user_id: actor.id,
      action: actor.action === "auto_approve" ? "moderate_auto_approve" : "moderate_approve",
      entity_type: "review",
      entity_id: reviewId,
      metadata: {},
    });
  }

  await processPublishedReview(reviewId);
  if (row.property_id) {
    await maybeRefreshPropertySummary(row.property_id);
    revalidatePath(`/property/${row.property_id}`);
    revalidatePath("/property/[id]", "page");
    revalidatePath("/search");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  return { ok: "Updated." };
}

function propertyIdFromJoin(reviews: { property_id: string } | { property_id: string }[] | null | undefined) {
  if (!reviews) return null;
  return Array.isArray(reviews) ? (reviews[0]?.property_id ?? null) : reviews.property_id;
}

export async function publishReply(
  client: SupabaseClient,
  replyId: string,
  actor: PublishActor,
): Promise<PublishResult> {
  const { data: row } = await client
    .from("review_replies")
    .select("id, review_id, status, reviews (property_id)")
    .eq("id", replyId)
    .maybeSingle();
  if (!row) return { error: "We couldn't update that item." };

  if (row.status !== "published") {
    const { error } = await client
      .from("review_replies")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", replyId);
    if (error) return { error: "We couldn't update that item." };
  }

  const logger = createAdminClient();
  if (logger) {
    await logger.from("moderation_actions").insert({
      moderator_id: actor.id,
      target_type: "review_reply",
      target_id: replyId,
      action: actor.action,
    });
    await logger.from("audit_logs").insert({
      actor_user_id: actor.id,
      action: actor.action === "auto_approve" ? "moderate_auto_approve" : "moderate_approve",
      entity_type: "review_reply",
      entity_id: replyId,
      metadata: {},
    });
  }

  const propertyId = propertyIdFromJoin(
    row.reviews as { property_id: string } | { property_id: string }[] | null,
  );
  if (propertyId) {
    revalidatePath(`/property/${propertyId}`);
    revalidatePath("/property/[id]", "page");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  return { ok: "Updated." };
}
