import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const RATE_LIMITS = {
  reviewSubmit: { limit: 5, windowSeconds: 60 * 60 },
  rentSubmit: { limit: 10, windowSeconds: 60 * 60 },
  propertyCreate: { limit: 10, windowSeconds: 60 * 60 * 24 },
  flag: { limit: 20, windowSeconds: 60 * 60 },
  vote: { limit: 120, windowSeconds: 60 * 60 },
  addressSearch: { limit: 60, windowSeconds: 60 },
  auth: { limit: 10, windowSeconds: 10 * 60 },
  claim: { limit: 5, windowSeconds: 60 * 60 * 24 },
  managerResponse: { limit: 30, windowSeconds: 60 * 60 },
  accountAction: { limit: 20, windowSeconds: 60 * 60 },
  aiAnon: { limit: 3, windowSeconds: 60 * 60 * 24 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

const memory = new Map<string, number[]>();

/** In-process fallback (per instance) when the service role is not configured. */
export function memoryRateLimit(key: string, limit: number, windowSeconds: number, now = Date.now()): boolean {
  const windowStart = now - windowSeconds * 1000;
  const hits = (memory.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  return true;
}

/**
 * Returns true if the action is allowed. Uses the shared Postgres counter when available so
 * limits hold across serverless instances; falls back to memory. Fails open on DB errors
 * to avoid blocking legitimate renters.
 */
export async function checkRateLimit(
  name: RateLimitName,
  subject: string,
  override?: { limit: number; windowSeconds: number },
): Promise<boolean> {
  const { limit, windowSeconds } = override ?? RATE_LIMITS[name];
  const key = `${name}:${subject}`;
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (!error) return data === true;
  }
  return memoryRateLimit(key, limit, windowSeconds);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const ok = memoryRateLimit(key, limit, windowMs / 1000);
  return { ok, remaining: ok ? 1 : 0 };
}
