"use server";

import { answerPropertyQuestion, AIUnavailableError } from "@/lib/ai/provider";
import { getSessionUser } from "@/lib/auth/session";
import { getPropertyById, getPropertyReviews } from "@/lib/properties/queries";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { track } from "@/lib/analytics";
import { hasOpenRouter } from "@/lib/env";
import { topicsFromReviewText } from "@/lib/reviews/topics-from-text";

export async function askLivRank(propertyId: string, question: string) {
  const user = await getSessionUser();
  const key = user?.id ?? "anon";
  const limited = rateLimit(`ai:${key}`, user?.subscription_status === "premium" ? 40 : 8);
  if (!limited.ok) {
    return { error: "You've reached the Ask LivRank limit for now. Please try again later." };
  }
  if (question.trim().length < 8) return { error: "Please ask a more complete question." };
  const property = await getPropertyById(propertyId);
  if (!property) return { error: "We couldn't find that property." };
  track("ai_question");

  let reviews = (await getPropertyReviews(property.id, { pageSize: 40 })).reviews;

  if (!hasOpenRouter()) {
    const hits = reviews.filter((r) =>
      `${r.review_title} ${r.review_body}`.toLowerCase().includes(
        question.toLowerCase().split(" ").find((w) => w.length > 5) ?? "maintenance",
      ),
    );
    if (reviews.length === 0) {
      return {
        answer:
          "There isn't enough published renter feedback to answer that reliably yet.",
      };
    }
    return {
      answer: `Based on ${reviews.length} published renter reviews, LivRank can retrieve matching reports when AI is configured. ${
        hits.length
          ? `A keyword scan found ${hits.length} possibly related published review(s). Configure OPENROUTER_API_KEY for a grounded written answer.`
          : "OpenRouter is not configured, so a written AI answer is unavailable. The property page still shows published reviews and renter-reported rent."
      }`,
    };
  }

  try {
    const result = await answerPropertyQuestion(question, {
      propertyLabel: `${property.address_line_1}, ${property.city} ${property.province}`,
      reviewCount: reviews.length,
      reviews: reviews.map((r) => ({
        id: r.id,
        title: r.review_title,
        body: r.review_body,
        overall_rating: r.overall_rating,
      })),
    });
    return { answer: result.answer };
  } catch (e) {
    if (e instanceof AIUnavailableError) {
      return {
        error:
          "Ask LivRank is temporarily unavailable. Published reviews on this page are still available.",
      };
    }
    return { error: "We couldn't answer that right now. Please try again." };
  }
}

export async function processPublishedReview(reviewId: string) {
  const admin = createAdminClient();
  if (!admin) return;
  const { data: review } = await admin
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("status", "published")
    .maybeSingle();
  if (!review) return;
  const text = `${review.review_title}\n${review.review_body}`;
  let wroteTopics = false;

  if (hasOpenRouter()) {
    try {
      const { classifyReview, detectPii, extractReviewTopics, generateEmbedding } = await import(
        "@/lib/ai/provider"
      );
      const [topics] = await Promise.all([
        extractReviewTopics(text),
        classifyReview(text),
        detectPii(text),
      ]);
      if (topics.topics.length) {
        await admin.from("review_topics").delete().eq("review_id", reviewId);
        await admin.from("review_topics").insert(
          topics.topics.map((t) => ({
            review_id: reviewId,
            topic: t.topic,
            confidence: t.confidence,
          })),
        );
        wroteTopics = true;
      }
      const embedding = await generateEmbedding(text);
      await admin.from("review_embeddings").upsert({
        review_id: reviewId,
        embedding,
        model_name: process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small",
      });
    } catch {
      // AI failure must not block published content.
    }
  }

  if (!wroteTopics) {
    const topics = topicsFromReviewText(text);
    if (topics.length) {
      await admin.from("review_topics").delete().eq("review_id", reviewId);
      await admin.from("review_topics").insert(
        topics.map((topic) => ({
          review_id: reviewId,
          topic,
          confidence: 0.55,
        })),
      );
    }
  }
}
