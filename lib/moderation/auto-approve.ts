import "server-only";

import { classifyReview, detectPii } from "@/lib/ai/provider";
import { hasOpenRouter } from "@/lib/env";
import { screenReview, type HoldReason } from "@/lib/moderation/review-gate";

const AI_TIMEOUT_MS = 10_000;
export const REVIEW_SPOT_CHECK_RATE = 0.1;

export type PublishDecision = {
  publish: boolean;
  reasons: HoldReason[];
};

function maybeSpotCheck(): PublishDecision {
  if (Math.random() < REVIEW_SPOT_CHECK_RATE) {
    return { publish: false, reasons: ["random_check"] };
  }
  return { publish: true, reasons: [] };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function decideReviewVisibility(input: {
  title: string;
  body: string;
}): Promise<PublishDecision> {
  const local = screenReview(input);
  if (!local.ok) return { publish: false, reasons: local.reasons as HoldReason[] };
  if (!hasOpenRouter()) return maybeSpotCheck();

  try {
    const text = `${input.title}\n${input.body}`;
    const [classification, pii] = await withTimeout(
      Promise.all([classifyReview(text), detectPii(text)]),
      AI_TIMEOUT_MS,
    );
    const reasons: HoldReason[] = [];
    if (classification.flag_for_moderation) reasons.push("ai_moderation");
    if (pii.has_possible_pii || pii.flag_for_moderation) reasons.push("ai_pii");
    return reasons.length ? { publish: false, reasons } : maybeSpotCheck();
  } catch {
    return { publish: false, reasons: ["ai_check_failed"] };
  }
}
