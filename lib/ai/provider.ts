import { hasOpenRouter } from "@/lib/env";
import { openRouterProvider } from "./openrouter";
import {
  AIUnavailableError,
  type AIProvider,
  type AnswerResult,
  type ClassificationResult,
  type PiiResult,
  type PropertyQuestionContext,
  type SummaryResult,
  type TopicsResult,
} from "./types";

let override: AIProvider | null = null;

export function setAIProvider(provider: AIProvider | null) {
  override = provider;
}

export function getAIProvider(): AIProvider {
  if (override) return override;
  if (hasOpenRouter()) return openRouterProvider;
  throw new AIUnavailableError();
}

export async function classifyReview(text: string): Promise<ClassificationResult> {
  return getAIProvider().classifyReview(text);
}

export async function detectPii(text: string): Promise<PiiResult> {
  return getAIProvider().detectPii(text);
}

export async function extractReviewTopics(text: string): Promise<TopicsResult> {
  return getAIProvider().extractReviewTopics(text);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return getAIProvider().generateEmbedding(text);
}

export async function generatePropertySummary(
  input: PropertyQuestionContext,
): Promise<SummaryResult> {
  return getAIProvider().generatePropertySummary(input);
}

export async function answerPropertyQuestion(
  question: string,
  input: PropertyQuestionContext,
): Promise<AnswerResult> {
  return getAIProvider().answerPropertyQuestion(question, input);
}

export { AIUnavailableError };
