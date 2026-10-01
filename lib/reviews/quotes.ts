import { looksSpammy } from "@/lib/moderation/review-gate";

function uniqueWords(text: string) {
  return [...new Set(text.toLowerCase().split(/\s+/).filter((word) => word.length > 1))];
}

function hasRepeatedToken(text: string) {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().split(/\s+/)) {
    const token = word.replace(/[^a-z0-9]/g, "");
    if (token.length < 4) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
    if ((counts.get(token) ?? 0) >= 3) return true;
  }
  return false;
}

function looksLikeSentence(text: string) {
  return /[.!?]/.test(text);
}

function isReadableQuote(snippet: string, body: string) {
  const words = uniqueWords(snippet);
  if (words.length < 4) return false;
  if (hasRepeatedToken(snippet) || hasRepeatedToken(body)) return false;
  if (looksSpammy("", snippet) || looksSpammy("", body)) return false;
  if (!looksLikeSentence(body) && !looksLikeSentence(snippet)) return false;
  return true;
}

/** First one or two verbatim sentences from published review bodies. Never generated. */
export function verbatimReviewQuotes(
  reviews: Array<{ review_body: string }>,
  limit = 2,
  maxLen = 140,
): string[] {
  const quotes: string[] = [];
  for (const review of reviews) {
    const cleaned = review.review_body.replace(/\s+/g, " ").trim();
    if (cleaned.length < 24) continue;
    const sentence = cleaned.match(/^[\s\S]+?[.!?](?=\s|$)/)?.[0] ?? cleaned;
    const clipped =
      sentence.length > maxLen ? `${sentence.slice(0, maxLen).replace(/\s+\S*$/, "").trimEnd()}…` : sentence;
    if (clipped.length < 20) continue;
    if (!isReadableQuote(clipped, cleaned)) continue;
    quotes.push(clipped);
    if (quotes.length >= limit) break;
  }
  return quotes;
}
