import { z } from "zod";

export const TOPICS = [
  "maintenance",
  "management",
  "noise",
  "parking",
  "security",
  "elevator",
  "heating",
  "water",
  "plumbing",
  "cleanliness",
  "pests",
  "neighbours",
  "rent_increases",
  "building_condition",
  "amenities",
  "transit",
  "location",
] as const;

export type Topic = (typeof TOPICS)[number];

export const classificationSchema = z.object({
  labels: z.array(
    z.enum([
      "spam",
      "harassment",
      "threat",
      "personal_information",
      "unsupported_accusation",
      "off_topic",
      "tenant_experience",
    ]),
  ),
  flag_for_moderation: z.boolean(),
  notes: z.string().optional(),
});

export const piiSchema = z.object({
  has_possible_pii: z.boolean(),
  kinds: z.array(z.string()),
  flag_for_moderation: z.boolean(),
});

export const topicsSchema = z.object({
  topics: z.array(
    z.object({
      topic: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export const summarySchema = z.object({
  summary: z.string(),
  topics: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0),
  supporting_review_ids: z.array(z.string()).default([]),
});

export const answerSchema = z.object({
  answer: z.string(),
  supporting_review_ids: z.array(z.string()).default([]),
  evidence_count: z.number().default(0),
  insufficient: z.boolean().default(false),
});

export type ClassificationResult = z.infer<typeof classificationSchema>;
export type PiiResult = z.infer<typeof piiSchema>;
export type TopicsResult = z.infer<typeof topicsSchema>;
export type SummaryResult = z.infer<typeof summarySchema>;
export type AnswerResult = z.infer<typeof answerSchema>;

export type PropertyQuestionContext = {
  propertyLabel: string;
  reviewCount: number;
  reviews: { id: string; title: string; body: string; overall_rating: number }[];
};

export interface AIProvider {
  classifyReview(text: string): Promise<ClassificationResult>;
  detectPii(text: string): Promise<PiiResult>;
  extractReviewTopics(text: string): Promise<TopicsResult>;
  generateEmbedding(text: string): Promise<number[]>;
  generatePropertySummary(input: PropertyQuestionContext): Promise<SummaryResult>;
  answerPropertyQuestion(
    question: string,
    input: PropertyQuestionContext,
  ): Promise<AnswerResult>;
}

export class AIUnavailableError extends Error {
  constructor(message = "AI is not configured or is temporarily unavailable.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}
