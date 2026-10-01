export type ScreenResult = { ok: true } | { ok: false; reasons: string[] };

export const HOLD_REASONS = {
  email: "Contains an email address",
  phone: "Contains a phone number",
  sin: "Contains a SIN-like number",
  threat: "Contains threatening language",
  slur: "Contains slurs or hate speech",
  unit_in_text: "Mentions a unit number in the review text",
  spam: "Looks too short or spam-like",
  ai_moderation: "AI flagged this for a moderator",
  ai_pii: "AI detected possible personal information",
  ai_check_failed: "Automatic check failed",
  publish_failed: "Could not publish automatically",
  random_check: "Spot check",
} as const;

export type HoldReason = keyof typeof HOLD_REASONS;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE =
  /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}\b|(?:\+?1[\s.-]?)?\d{10}\b/;
const SIN_RE = /\b\d{3}[\s-]\d{3}[\s-]\d{3}\b/;
const UNIT_LEAK_RE =
  /\b(?:unit|apartment|apt|suite|ste)\s*[#.:-]?\s*[A-Z]?\d{1,5}[A-Z]?\b|#\s*[A-Z]?\d{1,5}[A-Z]?\b|\bi\s+live\s+in\s+(?:unit|apt|apartment|suite|#)?\s*[A-Z]?\d{1,5}[A-Z]?\b/i;
const THREAT_RE =
  /\b(?:i(?:'|’| wi)ll\s+(?:kill|hurt|stab|shoot|find|bomb)|(?:kill|hurt|stab|shoot|murder)\s+you|kill\s+yourself|rape|bomb\s+(?:the|it|this)|burn\s+(?:it|the building)\s+down)\b/i;

const SLURS = new Set([
  "chink",
  "coon",
  "gook",
  "kike",
  "nigga",
  "nigger",
  "paki",
  "spic",
  "tranny",
  "faggot",
  "fag",
  "dyke",
  "retard",
  "retarded",
]);

export function labelHoldReason(reason: string): string {
  return HOLD_REASONS[reason as HoldReason] ?? reason;
}

export function holdReasonsFromFlags(flags: unknown): string[] {
  if (!flags) return [];
  if (Array.isArray(flags)) return flags.filter((item): item is string => typeof item === "string");
  if (typeof flags === "object" && flags !== null && "reasons" in flags) {
    const reasons = (flags as { reasons?: unknown }).reasons;
    if (Array.isArray(reasons)) return reasons.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function containsSlur(text: string): boolean {
  const words = text.toLowerCase().split(/[^a-z0-9]+/);
  return words.some((word) => SLURS.has(word));
}

export function looksSpammy(title: string, body: string): boolean {
  const text = `${title} ${body}`.toLowerCase();
  const letters = text.replace(/[^a-z]/g, "");
  if (letters.length >= 20) {
    const counts = new Map<string, number>();
    for (const ch of letters) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    const max = Math.max(...counts.values());
    if (max / letters.length > 0.45) return true;
  }
  const words = text.split(/\s+/).filter((word) => word.length > 1);
  const unique = new Set(words);
  if (words.length >= 8 && unique.size <= 3) return true;
  if (words.length >= 6 && unique.size / words.length < 0.25) return true;
  const tokenCounts = new Map<string, number>();
  for (const word of words) {
    const token = word.replace(/[^a-z0-9]/g, "");
    if (token.length < 4) continue;
    tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    if ((tokenCounts.get(token) ?? 0) >= 3) return true;
  }
  return false;
}

export function screenReview({ title, body }: { title: string; body: string }): ScreenResult {
  const text = `${title}\n${body}`;
  const reasons: HoldReason[] = [];
  if (EMAIL_RE.test(text)) reasons.push("email");
  if (PHONE_RE.test(text)) reasons.push("phone");
  if (SIN_RE.test(text)) reasons.push("sin");
  if (THREAT_RE.test(text)) reasons.push("threat");
  if (containsSlur(text)) reasons.push("slur");
  if (UNIT_LEAK_RE.test(text)) reasons.push("unit_in_text");
  if (looksSpammy(title, body)) reasons.push("spam");
  return reasons.length ? { ok: false, reasons } : { ok: true };
}
